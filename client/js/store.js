// store.js - Gestion de l'état local (imitation de Zustand)

let state = {}; // L'état global du client (privé)
const listeners = new Set(); // Les fonctions qui écoutent les changements

/**
 * Fonction interne pour notifier tous les écouteurs.
 */
function notify() {
  // Informe chaque écouteur que l'état a peut-être changé
  listeners.forEach(listener => listener());
}

/**
 * Définit l'état initial. Appelé une seule fois.
 * @param {object} initialState - L'état de départ.
 */
export function initializeState(initialState) {
  state = initialState;
}

/**
 * Remplace l'état entier.
 * Appelée par socket.js quand le serveur envoie le nouvel état.
 * @param {object} newState - Le nouvel état complet venant du serveur.
 */
export function setState(newState) {
  state = newState;
  notify(); // Notifie tout le monde
}

/**
 * Récupère l'état actuel (lecture seule).
 * @returns {object} L'état actuel.
 */
export function getState() {
  return state;
}

/**
 * S'abonne à une partie spécifique de l'état (le "sélecteur").
 * C'est la magie de Zustand.
 *
 * @param {function(object): any} selector - Une fonction qui extrait une partie de l'état.
 * @param {function(any): void} callback - La fonction à appeler quand la partie sélectionnée change.
 * @returns {function} Une fonction pour se désabonner.
 */
export function subscribe(selector, callback) {
  let lastValue = selector(state); // Stocke la valeur actuelle

  const listener = () => {
    const newValue = selector(state);
    // On ne lance le callback QUE si la valeur a changé
    if (newValue !== lastValue) {
      lastValue = newValue;
      callback(newValue);
    }
  };

  listeners.add(listener); // Ajoute au pool d'écouteurs

  // Retourne une fonction pour arrêter d'écouter
  return () => listeners.delete(listener);
}
