// server/services/avisService.js - Service de génération des avis syndicaux

import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Génère un document Word d'avis syndical à partir du template
 * @param {Object} avisData - Données de l'avis syndical
 * @returns {Promise<Object>} - Informations sur le document généré
 */
export async function genererAvisSyndical(avisData) {
    try {
        // Trouver le chemin racine du projet (dossier contenant server/)
        const projectRoot = path.join(__dirname, '..', '..');
        const templatePath = path.join(projectRoot, 'generated-docs', 'templates', 'Avis Template.docx');

        console.log('[AVIS] Project root:', projectRoot);
        console.log('[AVIS] Template path:', templatePath);
        console.log('[AVIS] Template existe?', fs.existsSync(templatePath));

        // Vérifier que le template existe
        if (!fs.existsSync(templatePath)) {
            // Essayer de lister les fichiers du dossier templates
            const templatesDir = path.join(projectRoot, 'generated-docs', 'templates');
            console.log('[AVIS] Dossier templates:', templatesDir);
            console.log('[AVIS] Dossier existe?', fs.existsSync(templatesDir));

            if (fs.existsSync(templatesDir)) {
                const files = fs.readdirSync(templatesDir);
                console.log('[AVIS] Fichiers dans templates:', files);
            }

            throw new Error(`Template non trouvé: ${templatePath}`);
        }

        // Lire le template
        console.log('[AVIS] Lecture du template...');
        const content = fs.readFileSync(templatePath, 'binary');
        console.log('[AVIS] Template lu avec succès, taille:', content.length, 'octets');

        // Créer un zip du document
        const zip = new PizZip(content);

        // Créer une instance de docxtemplater avec nullGetter pour éviter les zones jaunes
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            nullGetter: () => '' // Remplace les valeurs null/undefined par des chaînes vides
        });

        // Préparer les données pour le template
        const templateData = {
            DATE: avisData.dateAvisFormatted || avisData.dateAvis || '',
            DESCRIPTION: avisData.descriptionTravaux || '',
            TYPE_CONTRAT: avisData.types && avisData.types.includes('Contrat') ? '☑' : '☐',
            TYPE_MINEUR: avisData.types && avisData.types.includes('Mineur') ? '☑' : '☐',
            TYPE_SOUS_CONTRAT: avisData.types && avisData.types.includes('Sous-contrat') ? '☑' : '☐',
            ENTREPRENEUR: avisData.nomEntrepreneur || '',
            DATE_DEBUT: avisData.dateDebutFormatted || avisData.dateDebut || '',
            DATE_FIN: avisData.dateFinFormatted || avisData.dateFin || '',
            NB_TECHNICIENS: avisData.nbTechniciens || '0',
            NB_JOURS: avisData.nbJours || '0',
            HEURES_HOMME: avisData.heuresHomme || '0',
            RESPONSABLE_PROJET: avisData.responsableProjet || '',
            SURINTENDANT: avisData.surintendant || ''
        };

        console.log('[AVIS] Données pour le template:', templateData);

        // Remplir le template avec les données
        doc.render(templateData);

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

            console.log('[AVIS] Surlignage jaune supprimé du document');
        } catch (error) {
            console.warn('[AVIS] Impossible de supprimer le surlignage jaune:', error.message);
            // Continuer même si on ne peut pas enlever le surlignage
        }

        // Générer le document
        const buf = generatedZip.generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        // Créer le dossier de sortie s'il n'existe pas
        const outputDir = path.join(__dirname, '..', '..', 'generated-docs');
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Nom du fichier généré : Entrepreneur - Description - Date
        const entrepreneurName = (avisData.nomEntrepreneur || 'Entrepreneur')
            .trim()
            .substring(0, 30); // Limiter à 30 caractères

        // Créer une version abrégée de la description (max 50 caractères)
        let shortDescription = (avisData.descriptionTravaux || 'Travaux')
            .trim()
            .substring(0, 50);

        // Si la description a été tronquée au milieu d'un mot, couper au dernier espace
        if (avisData.descriptionTravaux && avisData.descriptionTravaux.length > 50) {
            const lastSpace = shortDescription.lastIndexOf(' ');
            if (lastSpace > 20) { // Garder au moins 20 caractères
                shortDescription = shortDescription.substring(0, lastSpace);
            }
        }

        // Formater la date de l'avis au format DD-MM-YYYY
        let dateForFilename = '';
        if (avisData.dateAvis) {
            const date = new Date(avisData.dateAvis);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            dateForFilename = `${day}-${month}-${year}`;
        } else {
            // Si pas de date, utiliser la date du jour
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = today.getFullYear();
            dateForFilename = `${day}-${month}-${year}`;
        }

        // Construire le nom du fichier : "Entrepreneur - Description - Date.docx"
        const fileName = `${entrepreneurName} - ${shortDescription} - ${dateForFilename}.docx`;
        const outputPath = path.join(outputDir, fileName);

        // Sauvegarder le document
        fs.writeFileSync(outputPath, buf);

        console.log(`[AVIS] ✅ Document généré: ${outputPath}`);

        return {
            success: true,
            fileName: fileName,
            filePath: outputPath,
            downloadUrl: `/download-avis/${fileName}`,
            message: 'Document Word généré avec succès!'
        };

    } catch (error) {
        console.error('[AVIS] ❌ Erreur lors de la génération:', error);
        throw error;
    }
}
