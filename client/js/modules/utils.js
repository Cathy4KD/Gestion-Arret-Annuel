/**
 * Module d'utilitaires généraux pour l'application d'arrêt annuel
 *
 * Ce module contient des fonctions utilitaires réutilisables à travers
 * toute l'application, incluant la gestion de session, formatage de dates,
 * et autres helpers généraux.
 *
 * @module utils
 * @source Lignes 5767-5790 et autres sections du fichier source arret-annuel-avec-liste.html
 */

/**
 * Obtient les informations de l'utilisateur actuel
 *
 * Cette fonction collecte diverses informations sur l'utilisateur et son environnement:
 * - Timestamp de la connexion
 * - User agent du navigateur
 * - Plateforme système
 * - Langue du navigateur
 * - Résolution d'écran
 * - Fuseau horaire
 * - Heure locale
 * - ID de session
 *
 * @returns {Object} Objet contenant les informations utilisateur
 * @returns {string} returns.timestamp - Date/heure ISO de la connexion
 * @returns {string} returns.userAgent - User agent du navigateur
 * @returns {string} returns.platform - Plateforme système (ex: 'Win32', 'MacIntel')
 * @returns {string} returns.language - Langue du navigateur (ex: 'fr-FR', 'en-US')
 * @returns {string} returns.screenResolution - Résolution d'écran (ex: '1920x1080')
 * @returns {string} returns.timezone - Fuseau horaire (ex: 'America/Montreal')
 * @returns {string} returns.localTime - Heure locale formatée
 * @returns {string} returns.sessionId - ID unique de session
 *
 * @example
 * const userInfo = getUserInfo();
 * console.log('Connexion:', userInfo.timestamp);
 * console.log('Session:', userInfo.sessionId);
 *
 * @source Lignes 5767-5778 du fichier source
 */
export function getUserInfo() {
    return {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screenResolution: `${screen.width}x${screen.height}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        localTime: new Date().toLocaleString('fr-FR'),
        sessionId: getOrCreateSessionId()
    };
}

/**
 * Crée ou récupère un ID de session unique
 *
 * Cette fonction:
 * - Vérifie si un ID de session existe déjà dans sessionStorage
 * - Si non, crée un nouvel ID unique basé sur le timestamp et un string aléatoire
 * - Sauvegarde l'ID dans sessionStorage pour la durée de la session
 *
 * @returns {string} L'ID de session unique (format: 'session-{timestamp}-{random}')
 *
 * @example
 * const sessionId = getOrCreateSessionId();
 * // Retourne quelque chose comme: 'session-1234567890-abc123def'
 *
 * // Les appels suivants dans la même session retournent le même ID
 * const sameId = getOrCreateSessionId();
 * console.log(sessionId === sameId); // true
 *
 * @source Lignes 5781-5788 du fichier source
 */
export function getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}

/**
 * Formate une date au format français (JJ/MM/AAAA)
 *
 * @param {Date|string|number} date - La date à formater
 * @returns {string} La date formatée (ex: '25/12/2024')
 *
 * @example
 * formatDate(new Date()); // '22/10/2025'
 * formatDate('2024-12-25'); // '25/12/2024'
 */
export function formatDate(date) {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

/**
 * Formate une date au format ISO (AAAA-MM-JJ)
 *
 * @param {Date|string|number} date - La date à formater
 * @returns {string} La date formatée au format ISO (ex: '2024-12-25')
 *
 * @example
 * formatDateISO(new Date()); // '2025-10-22'
 * formatDateISO('25/12/2024'); // '2024-12-25'
 */
export function formatDateISO(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Formate une date/heure au format français complet
 *
 * @param {Date|string|number} datetime - La date/heure à formater
 * @returns {string} La date/heure formatée (ex: '25/12/2024 14:30:00')
 *
 * @example
 * formatDateTime(new Date()); // '22/10/2025 14:30:45'
 */
export function formatDateTime(datetime) {
    const d = new Date(datetime);
    const dateStr = formatDate(d);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${dateStr} ${hours}:${minutes}:${seconds}`;
}

/**
 * Génère un ID unique
 *
 * @param {string} prefix - Préfixe pour l'ID (optionnel)
 * @returns {string} Un ID unique (ex: 'item-1234567890-abc123')
 *
 * @example
 * generateId('task'); // 'task-1234567890-abc123'
 * generateId(); // '1234567890-def456'
 */
export function generateId(prefix = '') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
}

/**
 * Vérifie si une valeur est vide (null, undefined, string vide, tableau vide)
 *
 * @param {*} value - La valeur à vérifier
 * @returns {boolean} true si la valeur est vide, false sinon
 *
 * @example
 * isEmpty(''); // true
 * isEmpty(null); // true
 * isEmpty([]); // true
 * isEmpty('hello'); // false
 * isEmpty([1, 2]); // false
 */
export function isEmpty(value) {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string' && value.trim() === '') return true;
    if (Array.isArray(value) && value.length === 0) return true;
    if (typeof value === 'object' && Object.keys(value).length === 0) return true;
    return false;
}

/**
 * Copie un texte dans le presse-papiers
 *
 * @param {string} text - Le texte à copier
 * @returns {Promise<boolean>} true si la copie a réussi, false sinon
 *
 * @example
 * await copyToClipboard('Texte à copier');
 */
export async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error('Erreur copie presse-papiers:', error);
        return false;
    }
}

/**
 * Télécharge un objet JSON en tant que fichier
 *
 * @param {Object} data - Les données à télécharger
 * @param {string} filename - Le nom du fichier (ex: 'data.json')
 * @returns {void}
 *
 * @example
 * downloadJSON({ name: 'John', age: 30 }, 'user.json');
 */
export function downloadJSON(data, filename) {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Échappe les caractères HTML dans une chaîne
 *
 * @param {string} text - Le texte à échapper
 * @returns {string} Le texte avec les caractères HTML échappés
 *
 * @example
 * escapeHTML('<script>alert("XSS")</script>');
 * // Retourne: '&lt;script&gt;alert("XSS")&lt;/script&gt;'
 */
export function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Calcule le nombre de jours entre deux dates
 *
 * @param {Date|string} date1 - Première date
 * @param {Date|string} date2 - Deuxième date
 * @returns {number} Nombre de jours entre les deux dates (absolu)
 *
 * @example
 * daysBetween('2024-01-01', '2024-01-10'); // 9
 */
export function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

/**
 * Trie un tableau d'objets par une propriété donnée
 *
 * @param {Array<Object>} array - Le tableau à trier
 * @param {string} property - La propriété par laquelle trier
 * @param {string} order - Ordre de tri ('asc' ou 'desc')
 * @returns {Array<Object>} Le tableau trié
 *
 * @example
 * const items = [{ name: 'Bob' }, { name: 'Alice' }];
 * sortByProperty(items, 'name', 'asc');
 * // Retourne: [{ name: 'Alice' }, { name: 'Bob' }]
 */
export function sortByProperty(array, property, order = 'asc') {
    return [...array].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];

        if (aVal < bVal) return order === 'asc' ? -1 : 1;
        if (aVal > bVal) return order === 'asc' ? 1 : -1;
        return 0;
    });
}

/**
 * Debounce une fonction (limite la fréquence d'exécution)
 *
 * @param {Function} func - La fonction à debouncer
 * @param {number} wait - Temps d'attente en millisecondes
 * @returns {Function} La fonction debouncée
 *
 * @example
 * const search = debounce(() => {
 *   console.log('Recherche...');
 * }, 300);
 *
 * input.addEventListener('input', search);
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
