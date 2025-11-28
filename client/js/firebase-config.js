// Configuration Firebase pour Gestion Arrêt Annuel
// Ce fichier initialise Firebase et exporte les services nécessaires

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, onSnapshot, writeBatch } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Configuration Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAbw3ygWzqCWd01eLfIP_qL0lUNb8oxE9U",
    authDomain: "gestion-arret-annuel.firebaseapp.com",
    projectId: "gestion-arret-annuel",
    storageBucket: "gestion-arret-annuel.firebasestorage.app",
    messagingSenderId: "667890337672",
    appId: "1:667890337672:web:eb8385f9496c00ca911c3d"
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);

// Initialiser Firestore
const db = getFirestore(app);

// Exporter les instances et fonctions
export {
    app,
    db,
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    onSnapshot,
    writeBatch
};

console.log('🔥 Firebase initialisé avec succès');
