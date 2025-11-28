/**
 * Routes API pour la gestion des templates et exports DOCX T55
 */

import express from 'express';
import multer from 'multer';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configuration du stockage pour multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = join(__dirname, '..', '..', 'server', 'uploads', 't55-templates');
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Garder le nom original avec timestamp pour éviter les conflits
        const timestamp = Date.now();
        cb(null, `template-${timestamp}-${file.originalname}`);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.originalname.endsWith('.docx')) {
            cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers DOCX sont acceptés'));
        }
    }
});

/**
 * POST /api/t55/upload-template
 * Upload un template DOCX
 */
router.post('/upload-template', upload.single('template'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Aucun fichier uploadé' });
        }

        console.log('[T55-DOCX] Template uploadé:', req.file.filename);

        res.json({
            success: true,
            filename: req.file.filename,
            path: req.file.path,
            originalname: req.file.originalname
        });
    } catch (error) {
        console.error('[T55-DOCX] Erreur upload:', error);
        res.status(500).json({ error: 'Erreur lors de l\'upload du template' });
    }
});

/**
 * POST /api/t55/generate-docx
 * Génère un document DOCX à partir du template et des données
 */
router.post('/generate-docx', async (req, res) => {
    try {
        const { templateFilename, data } = req.body;

        console.log('[T55-DOCX] 📥 Requête reçue');
        console.log('[T55-DOCX] Template filename:', templateFilename);
        console.log('[T55-DOCX] Entrepreneur:', data?.entrepreneur);
        console.log('[T55-DOCX] Nombre de dessins reçus:', data?.dessins?.length || 0);
        console.log('[T55-DOCX] Nombre de convertisseur reçus:', data?.convertisseur?.length || 0);
        console.log('[T55-DOCX] Nombre de couleeContinue reçus:', data?.couleeContinue?.length || 0);

        if (!templateFilename || !data) {
            console.error('[T55-DOCX] ❌ Données manquantes - templateFilename:', !!templateFilename, 'data:', !!data);
            return res.status(400).json({ error: 'Template ou données manquants' });
        }

        console.log('[T55-DOCX] Génération DOCX pour:', data.entrepreneur);

        // Log détaillé des données reçues
        if (data.convertisseur && data.convertisseur.length > 0) {
            console.log('[T55-DOCX] ✅ Données convertisseur:', data.convertisseur.length, 'entrées');
            console.log('[T55-DOCX] Premier élément convertisseur:', JSON.stringify(data.convertisseur[0], null, 2));
        } else {
            console.log('[T55-DOCX] ⚠️ Aucune donnée convertisseur reçue!');
        }

        if (data.couleeContinue && data.couleeContinue.length > 0) {
            console.log('[T55-DOCX] ✅ Données couleeContinue:', data.couleeContinue.length, 'entrées');
            console.log('[T55-DOCX] Premier élément couleeContinue:', JSON.stringify(data.couleeContinue[0], null, 2));
        } else {
            console.log('[T55-DOCX] ⚠️ Aucune donnée couleeContinue reçue!');
        }

        // Chemin du template
        const templatePath = join(__dirname, '..', '..', 'server', 'uploads', 't55-templates', templateFilename);
        console.log('[T55-DOCX] Chemin template:', templatePath);

        if (!existsSync(templatePath)) {
            console.error('[T55-DOCX] ❌ Template non trouvé:', templatePath);
            return res.status(404).json({ error: 'Template non trouvé' });
        }

        // Lire le template
        const content = readFileSync(templatePath, 'binary');

        // Créer un zip à partir du template
        const zip = new PizZip(content);

        // Créer une instance de docxtemplater avec nullGetter pour éviter les zones jaunes
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => '' // Remplace les valeurs null/undefined par des chaînes vides
        });

        // Préparer les données pour le template
        const templateData = prepareTemplateData(data);

        console.log('[T55-DOCX] Données préparées:', Object.keys(templateData));
        console.log('[T55-DOCX] ✅ TABLEAUX ACTIVÉS - génération avec les tableaux (dessins, convertisseur, coulée continue)');
        console.log('[T55-DOCX] Nombre de dessins:', templateData.dessins?.length || 0);
        console.log('[T55-DOCX] Nombre de travaux convertisseur:', templateData.convertisseur?.length || 0);
        console.log('[T55-DOCX] Nombre de travaux coulée continue:', templateData.couleeContinue?.length || 0);

        if (templateData.convertisseur && templateData.convertisseur.length > 0) {
            console.log('[T55-DOCX] Premier élément convertisseur préparé:', JSON.stringify(templateData.convertisseur[0], null, 2));
        }
        if (templateData.couleeContinue && templateData.couleeContinue.length > 0) {
            console.log('[T55-DOCX] Premier élément couleeContinue préparé:', JSON.stringify(templateData.couleeContinue[0], null, 2));
        }

        // Remplacer les variables dans le template
        try {
            doc.render(templateData);
            console.log('[T55-DOCX] ✅ Render réussi');
        } catch (renderError) {
            console.error('[T55-DOCX] ❌ ========== ERREUR RENDER ==========');
            console.error('[T55-DOCX] ❌ Type d\'erreur:', renderError.name);
            console.error('[T55-DOCX] ❌ Message:', renderError.message);

            if (renderError.properties) {
                const props = renderError.properties;
                console.error('[T55-DOCX] ❌ Détails de l\'erreur:');
                console.error('[T55-DOCX] ❌   - ID:', props.id);
                console.error('[T55-DOCX] ❌   - Explication:', props.explanation);
                console.error('[T55-DOCX] ❌   - Fichier XML:', props.file);
                console.error('[T55-DOCX] ❌   - Position:', props.offset);

                // Afficher des conseils selon le type d'erreur
                if (props.id === 'xmltemplater_content') {
                    console.error('[T55-DOCX] 💡 CONSEIL: Le template DOCX contient du XML invalide.');
                    console.error('[T55-DOCX] 💡 Solutions possibles:');
                    console.error('[T55-DOCX] 💡   1. Vérifiez que toutes les balises {variable} sont bien fermées');
                    console.error('[T55-DOCX] 💡   2. Vérifiez qu\'il n\'y a pas de caractères spéciaux dans les balises');
                    console.error('[T55-DOCX] 💡   3. Réessayez d\'uploader le template DOCX');
                    console.error('[T55-DOCX] 💡   4. Vérifiez que le fichier n\'est pas corrompu');
                } else if (props.id === 'unclosed_tag') {
                    console.error('[T55-DOCX] 💡 CONSEIL: Une balise n\'est pas fermée dans le template');
                    console.error('[T55-DOCX] 💡 Cherchez une balise comme {entrepreneur sans le }');
                } else if (props.id === 'unopened_tag') {
                    console.error('[T55-DOCX] 💡 CONSEIL: Une balise n\'est pas ouverte dans le template');
                    console.error('[T55-DOCX] 💡 Cherchez une balise comme entrepreneur} sans le {');
                }

                console.error('[T55-DOCX] ❌ Propriétés complètes:', JSON.stringify(props, null, 2));
            }

            console.error('[T55-DOCX] ❌ ===================================');
            throw renderError;
        }

        // Obtenir le zip généré pour enlever le surlignage jaune
        const generatedZip = doc.getZip();

        // Enlever le surlignage jaune du document
        try {
            const documentXml = generatedZip.file('word/document.xml').asText();

            // Supprimer toutes les balises de surlignage jaune
            const cleanedXml = documentXml
                .replace(/<w:highlight w:val="yellow"\/>/g, '')
                .replace(/<w:highlight w:val="yellow"><\/w:highlight>/g, '');

            // Mettre à jour le fichier document.xml dans le zip
            generatedZip.file('word/document.xml', cleanedXml);

            console.log('[T55-DOCX] Surlignage jaune supprimé du document');
        } catch (error) {
            console.warn('[T55-DOCX] Impossible de supprimer le surlignage jaune:', error.message);
            // Continuer même si on ne peut pas enlever le surlignage
        }

        // Générer le document
        const buf = generatedZip.generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        // Créer le répertoire de sortie si nécessaire
        const outputDir = join(__dirname, '..', '..', 'generated-docs');
        if (!existsSync(outputDir)) {
            mkdirSync(outputDir, { recursive: true });
        }

        // Nom du fichier de sortie : "Devis - Entrepreneur - Spécialité - Date.docx"
        const entrepreneurName = (data.entrepreneur || 'Entrepreneur').trim().substring(0, 30);
        const specialite = (data.specialite || '').trim().substring(0, 20);

        // Date au format DD-MM-YYYY
        const today = new Date();
        const dateStr = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;

        // Construire le nom : "Devis - Entrepreneur - Spécialité - Date.docx"
        let outputFilename;
        if (specialite) {
            outputFilename = `Devis - ${entrepreneurName} - ${specialite} - ${dateStr}.docx`;
        } else {
            outputFilename = `Devis - ${entrepreneurName} - ${dateStr}.docx`;
        }

        const outputPath = join(outputDir, outputFilename);

        // Sauvegarder le fichier généré
        writeFileSync(outputPath, buf);

        console.log('[T55-DOCX] Document généré:', outputFilename);

        // Retourner les informations du fichier généré
        res.json({
            success: true,
            fileName: outputFilename,
            filePath: outputPath,
            downloadUrl: `/download-devis/${outputFilename}`,
            message: 'Document DOCX généré avec succès!'
        });

    } catch (error) {
        console.error('[T55-DOCX] ❌ =========== ERREUR GÉNÉRATION ===========');
        console.error('[T55-DOCX] ❌ Type d\'erreur:', error.name);
        console.error('[T55-DOCX] ❌ Message:', error.message);
        console.error('[T55-DOCX] ❌ Stack trace:', error.stack);

        // Si c'est une erreur docxtemplater, donner plus de détails
        if (error.properties) {
            console.error('[T55-DOCX] ❌ Détails docxtemplater:');
            console.error('[T55-DOCX] ❌   - id:', error.properties.id);
            console.error('[T55-DOCX] ❌   - explanation:', error.properties.explanation);

            // Si c'est une multi-erreur, afficher toutes les erreurs individuelles
            if (error.properties.id === 'multi_error' && error.properties.errors) {
                console.error('[T55-DOCX] ❌ Nombre d\'erreurs:', error.properties.errors.length);
                error.properties.errors.forEach((err, index) => {
                    console.error(`[T55-DOCX] ❌ Erreur ${index + 1}/${error.properties.errors.length}:`);
                    console.error(`[T55-DOCX] ❌   - Type: ${err.properties?.id || err.name}`);
                    console.error(`[T55-DOCX] ❌   - Message: ${err.message}`);
                    console.error(`[T55-DOCX] ❌   - Explication: ${err.properties?.explanation || 'N/A'}`);
                    console.error(`[T55-DOCX] ❌   - Fichier: ${err.properties?.file || 'N/A'}`);
                    console.error(`[T55-DOCX] ❌   - Position: ${err.properties?.offset || 'N/A'}`);
                });
            } else {
                console.error('[T55-DOCX] ❌   - scope:', JSON.stringify(error.properties.scope, null, 2));
                console.error('[T55-DOCX] ❌   - file:', error.properties.file);
                console.error('[T55-DOCX] ❌   - offset:', error.properties.offset);
            }
            console.error('[T55-DOCX] ❌ Propriétés complètes:', JSON.stringify(error.properties, null, 2));
        }
        console.error('[T55-DOCX] ❌ =========================================');

        // Message d'erreur personnalisé pour l'utilisateur
        let userMessage = 'Erreur lors de la génération du document';
        let userHelp = '';
        let errorsList = [];

        if (error.properties && error.properties.id) {
            const errorId = error.properties.id;

            // Gérer les multi-erreurs
            if (errorId === 'multi_error' && error.properties.errors) {
                userMessage = `Le template contient ${error.properties.errors.length} erreur(s)`;
                errorsList = error.properties.errors.map((err, index) => {
                    const errId = err.properties?.id || 'unknown';
                    const errExplanation = err.properties?.explanation || err.message;
                    const errFile = err.properties?.file || 'N/A';

                    let errHelp = '';
                    if (errId === 'unclosed_tag') {
                        errHelp = 'Balise non fermée - vérifiez qu\'il n\'y a pas de { sans }';
                    } else if (errId === 'unopened_tag') {
                        errHelp = 'Balise non ouverte - vérifiez qu\'il n\'y a pas de } sans {';
                    } else if (errId === 'closing_tag_does_not_match_opening_tag') {
                        errHelp = 'Balise de fermeture ne correspond pas à l\'ouverture';
                    }

                    return {
                        number: index + 1,
                        type: errId,
                        message: err.message,
                        explanation: errExplanation,
                        file: errFile,
                        help: errHelp
                    };
                });

                userHelp = 'Consultez la liste des erreurs ci-dessous pour corriger votre template.';
            } else if (errorId === 'xmltemplater_content') {
                userMessage = 'Le template DOCX contient du XML invalide';
                userHelp = 'Vérifiez que toutes les balises {variable} sont bien fermées et que le fichier n\'est pas corrompu. Essayez de ré-uploader le template.';
            } else if (errorId === 'unclosed_tag') {
                userMessage = 'Une balise n\'est pas fermée dans le template';
                userHelp = `Cherchez une balise ouverte qui n'est pas fermée (ex: {entrepreneur sans }).`;
            } else if (errorId === 'unopened_tag') {
                userMessage = 'Une balise n\'est pas ouverte dans le template';
                userHelp = `Cherchez une balise fermée qui n'est pas ouverte (ex: entrepreneur} sans {).`;
            } else if (errorId === 'unimplemented_tag_type') {
                userMessage = 'Le template utilise une fonctionnalité non supportée';
                userHelp = 'Certaines fonctionnalités avancées de docxtemplater ne sont pas activées. Simplifiez votre template.';
            }
        }

        res.status(500).json({
            error: userMessage,
            details: error.message,
            help: userHelp,
            type: error.name,
            errors: errorsList.length > 0 ? errorsList : null,
            docxProperties: error.properties || null
        });
    }
});

/**
 * Nettoie une chaîne pour éviter les problèmes XML
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} - Chaîne nettoyée
 */
function cleanString(str) {
    if (!str) return '';
    // Convertir en string si ce n'est pas déjà le cas
    const s = String(str);
    // Supprimer les caractères de contrôle qui ne sont pas autorisés en XML
    // (garder \n \r \t qui sont valides)
    return s.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    // NOTE: Docxtemplater gère automatiquement l'échappement XML (&, <, >, etc.)
    // Ne PAS échapper manuellement sinon double échappement!
}

/**
 * Prépare les données du formulaire pour le remplacement dans le template
 * @param {Object} data - Données du formulaire
 * @returns {Object} - Données formatées pour docxtemplater
 */
function prepareTemplateData(data) {
    // Formater les dates au format DD/MM/YYYY pour l'affichage
    const formatDateFR = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateStr;
        }
    };

    const templateData = {
        // Informations de base
        entrepreneur: cleanString(data.entrepreneur || ''),
        titreDevis: cleanString(data.titreDevis || 'Devis général'),
        specialite: cleanString(data.specialite || ''),
        lieu: cleanString(data.lieu || ''),
        typeContrat: cleanString(data.typeContrat || ''),

        // Personnes responsables
        Approbateur: cleanString(data.approbateur || ''),
        Responsable: cleanString(data.responsable || ''),
        Vérificateur: cleanString(data.verificateur || ''),

        // Dates (format français DD/MM/YYYY)
        dateDebutVisites: formatDateFR(data.dates?.debutVisites),
        dateRemiseSoumission: formatDateFR(data.dates?.remiseSoumission),
        dateAdjudication: formatDateFR(data.dates?.adjudication),
        dateListeCognibox: formatDateFR(data.dates?.listeCognibox),
        dateDebutMobilisation: formatDateFR(data.dates?.debutMobilisation),
        dateFinMobilisation: formatDateFR(data.dates?.finMobilisation),
        dateDebutArret: formatDateFR(data.dates?.debutArret),
        dateFinArret: formatDateFR(data.dates?.finArret),
        dateDemobilisation: formatDateFR(data.dates?.demobilisation),

        // Dates spécifiques avec majuscules (pour correspondance template)
        DateAujourdhui: formatDateFR(new Date().toISOString()),
        DateVérification: formatDateFR(data.dates?.verification),
        DateApprobation: formatDateFR(data.dates?.approbation),

        // Tableaux (TOUS ACTIVÉS)
        dessins: (data.dessins || []).map(d => ({
            numero: cleanString(d.numero || ''),
            revision: cleanString(d.revision || ''),
            titre: cleanString(d.titre || '')
        })),

        convertisseur: (data.convertisseur || []).map(c => ({
            item: cleanString(c.item || ''),
            equipement: cleanString(c.equipement || ''),
            ordre: cleanString(c.ordre || ''),
            description: cleanString(c.description || ''),
            materielRTFT: cleanString(c.materielRTFT || ''),
            materielEntrepreneur: cleanString(c.materielEntrepreneur || ''),
            dessinsRef: cleanString(c.dessinsRef || '')
        })),

        couleeContinue: (data.couleeContinue || []).map(c => ({
            item: cleanString(c.item || ''),
            equipement: cleanString(c.equipement || ''),
            ordre: cleanString(c.ordre || ''),
            description: cleanString(c.description || ''),
            materielRTFT: cleanString(c.materielRTFT || ''),
            materielEntrepreneur: cleanString(c.materielEntrepreneur || ''),
            dessinsRef: cleanString(c.dessinsRef || '')
        })),

        historique: [],

        // Remarques
        remarquesGenerales: cleanString(data.remarquesGenerales || ''),
        corrections: cleanString(data.corrections || ''),

        // Date de génération (format français)
        dateGeneration: formatDateFR(new Date().toISOString()),

        // Informations supplémentaires
        nbDessins: (data.dessins || []).length,
        nbTravauxConvertisseur: (data.convertisseur || []).length,
        nbTravauxCouleeContinue: (data.couleeContinue || []).length
    };

    return templateData;
}

/**
 * Formate une date au format français
 * @param {string} dateStr - Date au format ISO
 * @returns {string} - Date formatée
 */
function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('fr-CA'); // Format YYYY-MM-DD
    } catch (e) {
        return dateStr;
    }
}

export default router;
