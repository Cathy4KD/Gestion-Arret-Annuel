// middleware/validation.js - Validation des données avec Joi (v2.0 - T88 support)
import Joi from 'joi';

/**
 * Schémas de validation Joi pour les différents types de données
 */

// Validation pour les noms de modules autorisés
const MODULES_AUTORISES = [
    'tasks', 'iw37nData', 'iw38Data', 'revisionTravauxData', 'psvData',
    'tpaaPwData', 'projetsData', 'demandesEchafaudagesData', 'demandesGruesNacellesData',
    'demandesVerrouillageData', 'piecesData', 'scopeData', 't21Data', 'daData',
    't33Data', 'devisData', 'cogniboxTasksData', 'equipementLevageData',
    't40Data', 'espaceClosData', 'toursRefroidissementData', 't51Data',
    't57Data', 'rencontresHebdoData', 'zonesData', 't63Data', 'avisSyndicauxData',
    'settingsData', 't60Data', 'planLevageData', 'contactsData', 'reunionsData',
    'avisData',
    // Modules additionnels identifiés
    'dataPageFilters', 't21ManualData', 't55Data', 't55EntrepreneursList', 'tpaaData', 'pwData',
    'approvisionnementData', 'consommablesData', 'ingqData', 'maintenancesCapitalisablesData',
    'teamData', 'amenagementData', 't30LongDelaiPieces', 'travailHauteurData',
    'nacellesData', 't55HistoriqueData', 'zonesEntreposageData', 'zonesPlanData',
    'protocoleArretData', 'scopeMarkers', 'scopeFilters', 'posteAllocations', 'psvPlans', 'arretData',
    't30CommandeData', 'equipementLevageFiles', 't55PdfTemplate', 't55DocxTemplate', 'dashboardCurrentFilter',
    'pointPresseData', 'besoinsNettoyageCommentaires', 'suiviCoutData', 't25Data',
    't30LongDelaiPieces', 't60LongDelaiPieces', 't60CommandeData', 't72Data',
    't88LongDelaiPieces', 't88CommandeData',
    // Modules TPAA/PW manuels et cached
    'tpaaPwManualData', 'tpaaPwCachedData', 'soumissionsManualData',
    // Modules d'analyse (T87 SMED, T82 AMDEC) et Archives
    'smedData', 'amdecData', 'archivesData',
    // Post-Mortem
    'notesProchainArret',
    // Système de synchronisation
    'syncStatus',
    // Besoins électriques
    'besoinElectriquesData',
    // Statuts des opérations SCOPE
    'scopeStatuts',
    // Données Gantt Pont Roulant
    'ganttPontRoulantData'
];

// Schéma pour la récupération d'un module
export const getModuleSchema = Joi.object({
    moduleName: Joi.string()
        .valid(...MODULES_AUTORISES)
        .required()
        .messages({
            'string.base': 'Le nom du module doit être une chaîne',
            'any.required': 'Le nom du module est obligatoire',
            'any.only': `Module non autorisé. Modules valides: ${MODULES_AUTORISES.join(', ')}`
        })
});

// Schéma pour la mise à jour d'un module
export const updateModuleSchema = Joi.object({
    moduleName: Joi.string()
        .valid(...MODULES_AUTORISES)
        .required(),
    data: Joi.alternatives()
        .try(
            Joi.array().items(Joi.object().unknown(true)),
            Joi.object().unknown(true),
            Joi.allow(null)
        )
        .required()
        .messages({
            'any.required': 'Les données sont obligatoires'
        }),
    userName: Joi.string()
        .min(1)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s\-_À-ÿ]+$/)
        .default('Anonyme')
        .messages({
            'string.pattern.base': 'Le nom d\'utilisateur contient des caractères non autorisés',
            'string.max': 'Le nom d\'utilisateur ne peut pas dépasser 100 caractères'
        })
});

// Schéma pour la mise à jour multiple
export const updateMultipleSchema = Joi.object({
    updates: Joi.array()
        .items(
            Joi.object({
                moduleName: Joi.string().valid(...MODULES_AUTORISES).required(),
                data: Joi.alternatives().try(
                    Joi.array(),
                    Joi.object().unknown(true),
                    Joi.allow(null)
                ).required()
            })
        )
        .min(1)
        .max(50)
        .required()
        .messages({
            'array.min': 'Au moins une mise à jour est requise',
            'array.max': 'Maximum 50 mises à jour simultanées autorisées'
        }),
    userName: Joi.string()
        .min(1)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s\-_À-ÿ]+$/)
        .default('Anonyme')
});

// Schéma pour la réinitialisation
export const resetDataSchema = Joi.object({
    userName: Joi.string()
        .min(1)
        .max(100)
        .pattern(/^[a-zA-Z0-9\s\-_À-ÿ]+$/)
        .default('Anonyme')
});

// Schéma pour les avis syndicaux
export const avisSyndicalSchema = Joi.object({
    // Champs obligatoires
    nomEntrepreneur: Joi.string().min(1).max(200).required(),
    descriptionTravaux: Joi.string().min(1).max(2000).required(),

    // Champs optionnels
    dateAvis: Joi.string().isoDate().optional().allow(''),
    dateAvisFormatted: Joi.string().optional().allow(''),
    representantLegale: Joi.string().min(1).max(200).optional().allow(''),
    dateDebut: Joi.string().isoDate().optional().allow(''),
    dateDebutFormatted: Joi.string().optional().allow(''),
    dateFin: Joi.string().isoDate().optional().allow(''),
    dateFinFormatted: Joi.string().optional().allow(''),
    heureDebut: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().allow(''),
    heureFin: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional().allow(''),
    lieuTravaux: Joi.string().min(1).max(500).optional().allow(''),
    natureTravaux: Joi.string().min(1).max(2000).optional().allow(''),
    nombreTravailleursEstime: Joi.number().integer().min(0).max(1000).optional(),

    // Champs du formulaire existant
    types: Joi.array().items(Joi.string()).optional(),
    typesString: Joi.string().optional().allow(''),
    nbTechniciens: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    nbJours: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    heuresHomme: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
    responsableProjet: Joi.string().max(200).optional().allow(''),
    surintendant: Joi.string().max(200).optional().allow(''),
    dateCreation: Joi.string().isoDate().optional(),
    fileName: Joi.string().optional(),
    downloadUrl: Joi.string().optional(),

    // Champs d'approbation
    approuve: Joi.boolean().optional(),
    dateApprobation: Joi.string().isoDate().optional().allow(null)
}).messages({
    'string.isoDate': 'La date doit être au format ISO (YYYY-MM-DD)',
    'string.pattern.base': 'L\'heure doit être au format HH:MM',
    'number.max': 'Le nombre de travailleurs ne peut pas dépasser 1000',
    'any.required': '{#label} est requis'
});

// Schéma pour l'envoi d'email
export const emailSchema = Joi.object({
    avisData: avisSyndicalSchema.required(),
    emailDestinataire: Joi.string()
        .email()
        .max(255)
        .required()
        .messages({
            'string.email': 'L\'adresse email n\'est pas valide',
            'any.required': 'L\'email du destinataire est obligatoire'
        })
});

/**
 * Middleware générique de validation pour Socket.IO
 * @param {Joi.Schema} schema - Schéma de validation Joi
 * @returns {Function} Middleware de validation
 */
export function validateSocketData(schema) {
    return (data) => {
        const { error, value } = schema.validate(data, {
            abortEarly: false, // Retourner toutes les erreurs
            stripUnknown: false, // Garder les champs inconnus pour flexibilité
            convert: true // Convertir les types automatiquement
        });

        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            throw new Error(`Validation échouée: ${errorDetails.map(e => `${e.field}: ${e.message}`).join(', ')}`);
        }

        return value;
    };
}

/**
 * Middleware de validation pour Express (routes HTTP)
 * @param {Joi.Schema} schema - Schéma de validation Joi
 * @param {string} source - Source des données ('body', 'query', 'params')
 * @returns {Function} Middleware Express
 */
export function validateRequest(schema, source = 'body') {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[source], {
            abortEarly: false,
            stripUnknown: true,
            convert: true
        });

        if (error) {
            const errorDetails = error.details.map(detail => ({
                field: detail.path.join('.'),
                message: detail.message
            }));

            return res.status(400).json({
                success: false,
                error: 'Validation échouée',
                details: errorDetails
            });
        }

        // Remplacer les données par les données validées
        req[source] = value;
        next();
    };
}

/**
 * Sanitize une chaîne pour prévenir les injections
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} Chaîne nettoyée
 */
export function sanitizeString(str) {
    if (typeof str !== 'string') return str;

    // Retirer les caractères de contrôle dangereux
    return str
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .trim();
}

/**
 * Sanitize récursivement un objet
 * @param {*} obj - Objet à nettoyer
 * @returns {*} Objet nettoyé
 */
export function sanitizeObject(obj) {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    } else if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    } else if (obj !== null && typeof obj === 'object') {
        const sanitized = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[sanitizeString(key)] = sanitizeObject(value);
        }
        return sanitized;
    }
    return obj;
}

export default {
    getModuleSchema,
    updateModuleSchema,
    updateMultipleSchema,
    resetDataSchema,
    avisSyndicalSchema,
    emailSchema,
    validateSocketData,
    validateRequest,
    sanitizeString,
    sanitizeObject
};
