/**
 * @fileoverview Module Timeline - Gestion de la timeline de lecture des plans
 * @module ui/timeline
 *
 * Ce module gère la lecture temporelle des plans avec des contrôles de playback
 * (play, pause, stop, step forward/backward) et un système de time scaling.
 *
 * Source: arret-annuel-avec-liste.html lignes 18433-18482
 */

/**
 * Données globales de la timeline (référence externe)
 * NOTE: Cette variable doit être fournie par le module de données principal
 * @type {Object}
 */
let planData = null;

/**
 * Initialise le module timeline avec les données du plan
 * @param {Object} data - Données du plan contenant timelinePlayback
 * @returns {void}
 */
export function initTimeline(data) {
    planData = data;
}

/**
 * Démarre la lecture de la timeline
 *
 * Si la timeline est déjà en lecture, ne fait rien.
 * Sinon, démarre un intervalle qui avance le temps courant
 * selon l'échelle de temps définie (timeScale).
 *
 * L'intervalle s'exécute toutes les secondes et avance le temps
 * de (timeScale * 60000) millisecondes.
 *
 * @returns {void}
 *
 * @example
 * playTimeline();
 */
export function playTimeline() {
    if (!planData) {
        console.warn('Timeline non initialisée - appeler initTimeline() d\'abord');
        return;
    }

    if (planData.timelinePlayback.isPlaying) return;

    planData.timelinePlayback.isPlaying = true;
    planData.timelinePlayback.interval = setInterval(() => {
        const scale = planData.timelinePlayback.timeScale;
        planData.timelinePlayback.currentTime = new Date(
            planData.timelinePlayback.currentTime.getTime() + scale * 60000
        );

        const currentTimeInput = document.getElementById('currentTimeInput');
        if (currentTimeInput) {
            currentTimeInput.value = planData.timelinePlayback.currentTime.toISOString().slice(0, 16);
        }
        updateTimeDisplay();
    }, 1000);
}

/**
 * Met en pause la lecture de la timeline
 *
 * Arrête l'intervalle de mise à jour du temps mais conserve
 * la position temporelle actuelle.
 *
 * @returns {void}
 *
 * @example
 * pauseTimeline();
 */
export function pauseTimeline() {
    if (!planData) {
        console.warn('Timeline non initialisée');
        return;
    }

    planData.timelinePlayback.isPlaying = false;
    if (planData.timelinePlayback.interval) {
        clearInterval(planData.timelinePlayback.interval);
        planData.timelinePlayback.interval = null;
    }
}

/**
 * Arrête la lecture de la timeline et réinitialise à l'heure actuelle
 *
 * Met en pause la timeline et réinitialise le temps courant
 * à l'heure système actuelle.
 *
 * @returns {void}
 *
 * @example
 * stopTimeline();
 */
export function stopTimeline() {
    if (!planData) {
        console.warn('Timeline non initialisée');
        return;
    }

    pauseTimeline();
    const now = new Date();
    const currentTimeInput = document.getElementById('currentTimeInput');
    if (currentTimeInput) {
        currentTimeInput.value = now.toISOString().slice(0, 16);
    }
    planData.timelinePlayback.currentTime = now;
    updateTimeDisplay();
}

/**
 * Recule d'un pas dans la timeline
 *
 * Met en pause la timeline et recule le temps courant
 * d'un intervalle égal à timeScale (en minutes).
 *
 * @returns {void}
 *
 * @example
 * stepBackward(); // Recule selon timeScale
 */
export function stepBackward() {
    if (!planData) {
        console.warn('Timeline non initialisée');
        return;
    }

    pauseTimeline();
    const scale = planData.timelinePlayback.timeScale;
    planData.timelinePlayback.currentTime = new Date(
        planData.timelinePlayback.currentTime.getTime() - scale * 60000
    );

    const currentTimeInput = document.getElementById('currentTimeInput');
    if (currentTimeInput) {
        currentTimeInput.value = planData.timelinePlayback.currentTime.toISOString().slice(0, 16);
    }
    updateTimeDisplay();
}

/**
 * Avance d'un pas dans la timeline
 *
 * Met en pause la timeline et avance le temps courant
 * d'un intervalle égal à timeScale (en minutes).
 *
 * @returns {void}
 *
 * @example
 * stepForward(); // Avance selon timeScale
 */
export function stepForward() {
    if (!planData) {
        console.warn('Timeline non initialisée');
        return;
    }

    pauseTimeline();
    const scale = planData.timelinePlayback.timeScale;
    planData.timelinePlayback.currentTime = new Date(
        planData.timelinePlayback.currentTime.getTime() + scale * 60000
    );

    const currentTimeInput = document.getElementById('currentTimeInput');
    if (currentTimeInput) {
        currentTimeInput.value = planData.timelinePlayback.currentTime.toISOString().slice(0, 16);
    }
    updateTimeDisplay();
}

/**
 * Ferme le mode lecture et réinitialise la timeline
 *
 * Met en pause la timeline, masque le conteneur du mode lecture
 * et désélectionne le plan actif.
 *
 * @returns {void}
 *
 * @example
 * closeModeLecture();
 */
export function closeModeLecture() {
    if (!planData) {
        console.warn('Timeline non initialisée');
        return;
    }

    pauseTimeline();
    const container = document.getElementById('modeLectureContainer');
    if (container) {
        container.style.display = 'none';
    }
    planData.selectedPlanId = null;
}

/**
 * Met à jour l'affichage du temps dans l'interface
 *
 * NOTE: Cette fonction doit être implémentée selon l'interface utilisateur
 * Elle est appelée après chaque mise à jour du temps courant.
 *
 * @returns {void}
 * @private
 */
function updateTimeDisplay() {
    // Cette fonction sera implémentée par l'application principale
    // Elle doit mettre à jour l'affichage visuel du temps actuel
    if (typeof window !== 'undefined' && window.updateTimeDisplay) {
        window.updateTimeDisplay();
    }
}

/**
 * Obtient l'état actuel de la timeline
 * @returns {Object|null} État de la timeline ou null si non initialisée
 */
export function getTimelineState() {
    if (!planData) return null;
    return {
        isPlaying: planData.timelinePlayback.isPlaying,
        currentTime: planData.timelinePlayback.currentTime,
        timeScale: planData.timelinePlayback.timeScale
    };
}

/**
 * Définit l'échelle de temps de la timeline
 * @param {number} scale - Nouvelle échelle de temps (en minutes)
 * @returns {void}
 */
export function setTimeScale(scale) {
    if (!planData) {
        console.warn('Timeline non initialisée');
        return;
    }
    planData.timelinePlayback.timeScale = scale;
}

/**
 * Définit le temps courant de la timeline
 * @param {Date} time - Nouveau temps courant
 * @returns {void}
 */
export function setCurrentTime(time) {
    if (!planData) {
        console.warn('Timeline non initialisée');
        return;
    }
    planData.timelinePlayback.currentTime = time;
    updateTimeDisplay();
}
