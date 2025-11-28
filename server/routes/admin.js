/**
 * Routes d'administration
 * Endpoints pour monitoring et gestion
 */

import express from 'express';
import { readdir, stat, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import os from 'os';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Stocker l'heure de démarrage du serveur
const serverStartTime = Date.now();

// Compteur de requêtes
let requestCount = 0;
let requestsPerMinute = [];

// Middleware pour compter les requêtes
router.use((req, res, next) => {
  requestCount++;
  const now = Date.now();
  requestsPerMinute.push(now);

  // Garder seulement les requêtes de la dernière minute
  requestsPerMinute = requestsPerMinute.filter(time => now - time < 60000);

  next();
});

/**
 * GET /api/admin/stats
 * Retourne les statistiques du serveur
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getServerStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la récupération des statistiques' }
    });
  }
});

/**
 * GET /api/admin/logs
 * Retourne les derniers logs
 */
router.get('/logs', async (req, res) => {
  try {
    const { level, limit = 100, search } = req.query;
    const logs = await getRecentLogs(level, parseInt(limit), search);

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Erreur lors de la lecture des logs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la lecture des logs' }
    });
  }
});

/**
 * GET /api/admin/health
 * Retourne l'état de santé du système
 */
router.get('/health', async (req, res) => {
  try {
    const health = await getSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    console.error('Erreur lors de la vérification de santé:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Erreur lors de la vérification de santé' }
    });
  }
});

/**
 * Récupère les statistiques du serveur
 */
async function getServerStats() {
  const rootPath = join(__dirname, '..', '..');

  // Uptime
  const uptime = Date.now() - serverStartTime;
  const uptimeSeconds = Math.floor(uptime / 1000);

  // Mémoire
  const memoryUsage = process.memoryUsage();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();

  // CPU
  const cpus = os.cpus();
  const cpuUsage = process.cpuUsage();

  // Taille des données
  const dataPath = join(rootPath, 'server', 'data', 'application-data.json');
  let dataSize = 0;
  if (existsSync(dataPath)) {
    const dataStat = await stat(dataPath);
    dataSize = dataStat.size;
  }

  // Nombre de backups
  const backupsPath = join(rootPath, 'server', 'data', 'backups');
  let backupsCount = 0;
  if (existsSync(backupsPath)) {
    const backups = await readdir(backupsPath);
    backupsCount = backups.filter(f => f.endsWith('.json') || f.endsWith('.json.gz')).length;
  }

  const dailyBackupsPath = join(rootPath, 'server', 'data', 'backups-daily');
  let dailyBackupsCount = 0;
  if (existsSync(dailyBackupsPath)) {
    const dailyBackups = await readdir(dailyBackupsPath);
    dailyBackupsCount = dailyBackups.filter(f => f.endsWith('.json') || f.endsWith('.json.gz')).length;
  }

  // Requêtes
  const rpm = requestsPerMinute.length;

  // Nombre de clients Socket.IO (si io est accessible)
  let connectedClients = 0;
  if (global.io) {
    connectedClients = global.io.engine.clientsCount || 0;
  }

  return {
    server: {
      uptime: uptimeSeconds,
      uptimeFormatted: formatUptime(uptimeSeconds),
      startTime: new Date(serverStartTime).toISOString(),
      nodeVersion: process.version,
      platform: os.platform(),
      hostname: os.hostname()
    },
    memory: {
      used: memoryUsage.heapUsed,
      total: memoryUsage.heapTotal,
      rss: memoryUsage.rss,
      external: memoryUsage.external,
      systemTotal: totalMemory,
      systemFree: freeMemory,
      usagePercent: ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2),
      systemUsagePercent: (((totalMemory - freeMemory) / totalMemory) * 100).toFixed(2)
    },
    cpu: {
      count: cpus.length,
      model: cpus[0]?.model || 'Unknown',
      speed: cpus[0]?.speed || 0,
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: os.loadavg()
    },
    data: {
      size: dataSize,
      sizeFormatted: formatBytes(dataSize),
      backups: backupsCount,
      dailyBackups: dailyBackupsCount
    },
    network: {
      requestCount,
      requestsPerMinute: rpm,
      connectedClients
    }
  };
}

/**
 * Récupère les logs récents
 */
async function getRecentLogs(level, limit = 100, search = null) {
  const rootPath = join(__dirname, '..', '..');
  const logsPath = join(rootPath, 'logs');

  if (!existsSync(logsPath)) {
    return [];
  }

  // Trouver le fichier de log du jour
  const today = new Date().toISOString().split('T')[0];
  const combinedLogFile = join(logsPath, `combined-${today}.log`);
  const errorLogFile = join(logsPath, `error-${today}.log`);

  const logs = [];

  // Lire le fichier de log combiné
  if (existsSync(combinedLogFile)) {
    const content = await readFile(combinedLogFile, 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    for (const line of lines) {
      try {
        const logEntry = JSON.parse(line);

        // Filtrer par niveau si spécifié
        if (level && logEntry.level !== level) {
          continue;
        }

        // Filtrer par recherche si spécifiée
        if (search && !JSON.stringify(logEntry).toLowerCase().includes(search.toLowerCase())) {
          continue;
        }

        logs.push(logEntry);
      } catch (e) {
        // Ignorer les lignes invalides
      }
    }
  }

  // Trier par timestamp décroissant (plus récents en premier)
  logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Limiter le nombre de résultats
  return logs.slice(0, limit);
}

/**
 * Vérifie la santé du système
 */
async function getSystemHealth() {
  const rootPath = join(__dirname, '..', '..');
  const alerts = [];
  const checks = [];

  // Vérifier l'espace disque
  const freeMemory = os.freemem();
  const totalMemory = os.totalmem();
  const memoryUsagePercent = ((totalMemory - freeMemory) / totalMemory) * 100;

  checks.push({
    name: 'Mémoire système',
    status: memoryUsagePercent < 90 ? 'ok' : 'warning',
    value: `${memoryUsagePercent.toFixed(1)}%`,
    message: memoryUsagePercent < 90 ? 'Mémoire OK' : 'Mémoire élevée'
  });

  if (memoryUsagePercent >= 90) {
    alerts.push({
      level: 'warning',
      message: `Mémoire système élevée: ${memoryUsagePercent.toFixed(1)}%`
    });
  }

  // Vérifier la mémoire Node.js
  const nodeMemory = process.memoryUsage();
  const nodeMemoryPercent = (nodeMemory.heapUsed / nodeMemory.heapTotal) * 100;

  checks.push({
    name: 'Mémoire Node.js',
    status: nodeMemoryPercent < 90 ? 'ok' : 'warning',
    value: `${nodeMemoryPercent.toFixed(1)}%`,
    message: nodeMemoryPercent < 90 ? 'Mémoire OK' : 'Mémoire élevée'
  });

  // Vérifier les backups
  const backupsPath = join(rootPath, 'server', 'data', 'backups');
  let hasRecentBackup = false;

  if (existsSync(backupsPath)) {
    const files = await readdir(backupsPath);
    const backups = files.filter(f => f.startsWith('backup-') && (f.endsWith('.json') || f.endsWith('.json.gz')));

    if (backups.length > 0) {
      // Vérifier qu'il y a un backup de moins de 10 minutes
      const now = Date.now();
      for (const backup of backups) {
        const backupPath = join(backupsPath, backup);
        const backupStat = await stat(backupPath);
        const backupAge = now - backupStat.mtimeMs;

        if (backupAge < 10 * 60 * 1000) { // 10 minutes
          hasRecentBackup = true;
          break;
        }
      }
    }
  }

  checks.push({
    name: 'Backups récents',
    status: hasRecentBackup ? 'ok' : 'warning',
    value: hasRecentBackup ? 'OK' : 'Aucun backup récent',
    message: hasRecentBackup ? 'Backup récent trouvé' : 'Pas de backup depuis 10+ minutes'
  });

  if (!hasRecentBackup) {
    alerts.push({
      level: 'warning',
      message: 'Aucun backup récent (10+ minutes)'
    });
  }

  // Vérifier les fichiers critiques
  const criticalFiles = [
    'server/data/application-data.json',
    'server/server.js',
    'package.json'
  ];

  for (const file of criticalFiles) {
    const filePath = join(rootPath, file);
    const exists = existsSync(filePath);

    checks.push({
      name: `Fichier ${file}`,
      status: exists ? 'ok' : 'error',
      value: exists ? 'Présent' : 'Manquant',
      message: exists ? 'OK' : 'Fichier critique manquant'
    });

    if (!exists) {
      alerts.push({
        level: 'error',
        message: `Fichier critique manquant: ${file}`
      });
    }
  }

  return {
    status: alerts.some(a => a.level === 'error') ? 'error' :
            alerts.length > 0 ? 'warning' : 'ok',
    checks,
    alerts,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formate un temps en secondes en format lisible
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}j`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

/**
 * Formate des bytes en format lisible
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default router;
