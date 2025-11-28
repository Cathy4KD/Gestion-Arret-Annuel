/**
 * Module de gestion de la version de l'application
 */

export const APP_VERSION = '1.0.0';
export const BUILD_DATE = '2025-11-15';

/**
 * Affiche la version dans le footer
 */
export function displayVersion() {
  const footer = document.querySelector('footer') || createFooter();

  const versionElement = document.createElement('div');
  versionElement.id = 'app-version';
  versionElement.style.cssText = `
    position: fixed;
    bottom: 10px;
    right: 10px;
    background: rgba(0,0,0,0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 0.75rem;
    z-index: 1000;
    font-family: monospace;
  `;
  versionElement.textContent = `v${APP_VERSION}`;
  versionElement.title = `Version ${APP_VERSION}\nBuild: ${BUILD_DATE}`;

  document.body.appendChild(versionElement);
}

function createFooter() {
  const footer = document.createElement('footer');
  document.body.appendChild(footer);
  return footer;
}

/**
 * Obtient les informations de version
 */
export function getVersionInfo() {
  return {
    version: APP_VERSION,
    buildDate: BUILD_DATE,
    userAgent: navigator.userAgent,
    platform: navigator.platform
  };
}

/**
 * Log la version au démarrage
 */
export function logVersion() {
  console.info(`%c
  ╔════════════════════════════════════════════════╗
  ║   🏭 Gestionnaire d'Arrêt d'Aciérie           ║
  ║   Version ${APP_VERSION.padEnd(35)} ║
  ║   Build ${BUILD_DATE.padEnd(37)} ║
  ╚════════════════════════════════════════════════╝
  `, 'color: #2c5f8d; font-weight: bold;');
}

export default {
  APP_VERSION,
  BUILD_DATE,
  displayVersion,
  getVersionInfo,
  logVersion
};
