/**
 * Module de gestion des thèmes pour l'application d'arrêt annuel
 *
 * Ce module gère le changement de thème visuel de l'application.
 * Le thème n'est pas persisté et sera réinitialisé à chaque rechargement.
 *
 * @module theme
 * @source Lignes 12720-12740 du fichier source arret-annuel-avec-liste.html
 */

/**
 * Change le thème visuel de l'application
 *
 * Cette fonction:
 * - Retire toutes les classes de thème existantes du body
 * - Ajoute la nouvelle classe de thème
 *
 * @param {string} themeName - Le nom du thème à appliquer (ex: 'default', 'dark', 'blue')
 * @returns {void}
 *
 * @example
 * changeTheme('dark');    // Applique le thème sombre
 * changeTheme('default'); // Applique le thème par défaut
 * changeTheme('blue');    // Applique le thème bleu
 *
 * @dependencies
 * - Nécessite que les classes CSS theme-{themeName} soient définies
 */
export function changeTheme(themeName) {
    // Retirer toutes les classes de thème existantes
    document.body.className = document.body.className.replace(/theme-\w+/g, '').trim();

    // Ajouter la nouvelle classe de thème
    document.body.classList.add('theme-' + themeName);

    console.log(`[THEME] Thème changé vers: ${themeName}`);
}

/**
 * Charge le thème par défaut
 *
 * Cette fonction:
 * - Applique le thème par défaut au body
 * - Met à jour le select dropdown du thème si disponible
 *
 * @returns {void}
 *
 * @example
 * // Au chargement de la page
 * loadSavedTheme(); // Applique le thème par défaut
 */
export function loadSavedTheme() {
    const defaultTheme = 'default';

    // Appliquer la classe de thème au body
    document.body.classList.add('theme-' + defaultTheme);

    // Mettre à jour le dropdown de sélection du thème s'il existe
    const themeSelect = document.getElementById('themeSelect');
    if (themeSelect) {
        themeSelect.value = defaultTheme;
    }

    console.log(`[THEME] Thème chargé: ${defaultTheme}`);
}

/**
 * Liste des thèmes disponibles dans l'application
 * @constant {string[]}
 */
export const AVAILABLE_THEMES = [
    'default',
    'dark',
    'blue',
    'green',
    'purple',
    'modern-industrial'
];

/**
 * Obtient le thème actuellement actif
 *
 * @returns {string} Le nom du thème actuellement actif
 *
 * @example
 * const currentTheme = getCurrentTheme();
 * console.log('Thème actuel:', currentTheme); // 'dark'
 */
export function getCurrentTheme() {
    // Récupérer le thème depuis les classes du body
    const themeClass = Array.from(document.body.classList).find(c => c.startsWith('theme-'));
    return themeClass ? themeClass.replace('theme-', '') : 'default';
}

/**
 * Réinitialise le thème au thème par défaut
 *
 * @returns {void}
 *
 * @example
 * resetTheme(); // Réinitialise au thème 'default'
 */
export function resetTheme() {
    changeTheme('default');
}
