/**
 * Middleware de sécurité pour Express
 * Configure les headers de sécurité et les protections
 */

/**
 * Configuration des headers de sécurité (équivalent Helmet)
 * À utiliser si Helmet n'est pas installé
 */
export function securityHeaders(req, res, next) {
  // Content Security Policy - Empêche XSS
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://cdn.sheetjs.com; " +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com; " +
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' ws: wss:; " +
    "frame-ancestors 'none';"
  );

  // Empêche le navigateur de deviner le MIME type
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Empêche le clickjacking
  res.setHeader('X-Frame-Options', 'DENY');

  // Active la protection XSS du navigateur
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Force HTTPS (si applicable)
  // res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Empêche les infos sur les technologies utilisées
  res.removeHeader('X-Powered-By');

  // Referrer Policy - Contrôle les infos envoyées dans le header Referrer
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - Contrôle les features du navigateur
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  next();
}

/**
 * Protection CSRF basique (pour usage local)
 * Vérifie que les requêtes modifiantes viennent de la même origine
 */
export function csrfProtection(req, res, next) {
  // Ignorer les méthodes safe (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Vérifier l'origine ou le referer
  const origin = req.get('Origin');
  const referer = req.get('Referer');
  const host = req.get('Host');

  // Pour les WebSockets et les requêtes sans origin/referer, passer
  if (!origin && !referer) {
    return next();
  }

  // Vérifier que l'origine correspond à l'hôte
  if (origin) {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'CSRF_DETECTED',
          message: 'Origine de la requête non autorisée'
        }
      });
    }
  }

  next();
}

/**
 * Configuration CORS pour usage local
 * Permet seulement les requêtes depuis localhost
 */
export function localCorsConfig(req, res, next) {
  const origin = req.get('Origin');

  // Liste blanche des origines autorisées
  const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    `http://${req.hostname}:3000`
  ];

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  // Répondre aux preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
}

/**
 * Sanitize les paramètres de requête pour éviter les injections
 * @param {Object} params - Paramètres à nettoyer
 * @returns {Object} - Paramètres nettoyés
 */
export function sanitizeParams(params) {
  const sanitized = {};

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') {
      // Supprimer les caractères de contrôle dangereux
      sanitized[key] = value
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Middleware pour sanitizer les query params, body et params
 */
export function sanitizeMiddleware(req, res, next) {
  if (req.query) {
    req.query = sanitizeParams(req.query);
  }

  if (req.params) {
    req.params = sanitizeParams(req.params);
  }

  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeParams(req.body);
  }

  next();
}

/**
 * Protection contre les attaques de timing
 * Ajoute un délai aléatoire pour masquer les temps de réponse
 */
export function timingSafeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') {
    return false;
  }

  const aLen = Buffer.byteLength(a);
  const bLen = Buffer.byteLength(b);
  const len = Math.max(aLen, bLen);

  let result = 0;

  for (let i = 0; i < len; i++) {
    result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  }

  return result === 0 && aLen === bLen;
}

/**
 * Empêche l'énumération d'utilisateurs
 * Retourne toujours le même message d'erreur générique
 */
export function genericAuthError(res) {
  return res.status(401).json({
    success: false,
    error: {
      code: 'AUTHENTICATION_FAILED',
      message: 'Identifiants invalides'
    }
  });
}

/**
 * Logger les tentatives suspectes
 */
export function logSuspiciousActivity(req, activityType, details = {}) {
  console.warn('⚠️  ACTIVITÉ SUSPECTE:', {
    type: activityType,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...details
  });
}

/**
 * Détecte les tentatives d'injection SQL basiques
 * (Note: l'app utilise JSON, pas SQL, mais garde la fonction pour référence)
 */
export function detectSqlInjection(input) {
  if (typeof input !== 'string') return false;

  const sqlPatterns = [
    /(\bUNION\b.*\bSELECT\b)/i,
    /(\bSELECT\b.*\bFROM\b)/i,
    /(\bINSERT\b.*\bINTO\b)/i,
    /(\bDELETE\b.*\bFROM\b)/i,
    /(\bDROP\b.*\bTABLE\b)/i,
    /(\bUPDATE\b.*\bSET\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Détecte les tentatives de path traversal
 */
export function detectPathTraversal(input) {
  if (typeof input !== 'string') return false;

  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e%5c/i,
    /\.\.%2f/i,
    /\.\.%5c/i
  ];

  return pathTraversalPatterns.some(pattern => pattern.test(input));
}

/**
 * Middleware de détection d'attaques
 */
export function attackDetectionMiddleware(req, res, next) {
  const inputs = [
    ...Object.values(req.query || {}),
    ...Object.values(req.params || {}),
    ...(typeof req.body === 'object' ? Object.values(req.body) : [])
  ];

  for (const input of inputs) {
    if (typeof input !== 'string') continue;

    // SQL Injection
    if (detectSqlInjection(input)) {
      logSuspiciousActivity(req, 'SQL_INJECTION_ATTEMPT', { input });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Entrée invalide détectée'
        }
      });
    }

    // Path Traversal
    if (detectPathTraversal(input)) {
      logSuspiciousActivity(req, 'PATH_TRAVERSAL_ATTEMPT', { input });
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_PATH',
          message: 'Chemin invalide détecté'
        }
      });
    }
  }

  next();
}

/**
 * Limite la longueur des requêtes JSON
 */
export function jsonSizeLimit(maxSize = '10mb') {
  return (req, res, next) => {
    const contentLength = req.get('content-length');

    if (contentLength) {
      const sizeInBytes = parseInt(contentLength, 10);
      const maxSizeInBytes = parseSize(maxSize);

      if (sizeInBytes > maxSizeInBytes) {
        return res.status(413).json({
          success: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: `Payload trop large. Maximum: ${maxSize}`
          }
        });
      }
    }

    next();
  };
}

/**
 * Parse une taille (ex: '10mb' -> bytes)
 */
function parseSize(size) {
  if (typeof size === 'number') return size;

  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024
  };

  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
  if (!match) return 10 * 1024 * 1024; // Défaut 10MB

  const value = parseFloat(match[1]);
  const unit = match[2];

  return value * (units[unit] || 1);
}

/**
 * Configuration de sécurité complète
 * Combine tous les middlewares de sécurité
 */
export function setupSecurity(app, options = {}) {
  const {
    enableCsrf = false, // Désactivé par défaut pour usage local
    enableCors = true,
    enableAttackDetection = true,
    enableSanitization = true
  } = options;

  // Headers de sécurité
  app.use(securityHeaders);

  // CORS (si activé)
  if (enableCors) {
    app.use(localCorsConfig);
  }

  // Sanitization (si activé)
  if (enableSanitization) {
    app.use(sanitizeMiddleware);
  }

  // Détection d'attaques (si activé)
  if (enableAttackDetection) {
    app.use(attackDetectionMiddleware);
  }

  // Protection CSRF (si activé)
  if (enableCsrf) {
    app.use(csrfProtection);
  }

  console.log('✅ Middlewares de sécurité configurés');
}

export default {
  securityHeaders,
  csrfProtection,
  localCorsConfig,
  sanitizeParams,
  sanitizeMiddleware,
  timingSafeCompare,
  genericAuthError,
  logSuspiciousActivity,
  detectSqlInjection,
  detectPathTraversal,
  attackDetectionMiddleware,
  jsonSizeLimit,
  setupSecurity
};
