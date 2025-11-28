/**
 * Routes pour la gestion des fichiers (upload/download)
 * @module routes/files
 */

import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Configuration du stockage avec multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');

        // Créer le dossier uploads s'il n'existe pas
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Générer un nom unique: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const nameWithoutExt = path.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, sanitizedName + '-' + uniqueSuffix + ext);
    }
});

// Filtre pour les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
    // Liste des extensions autorisées
    const allowedTypes = [
        '.pdf', '.doc', '.docx', '.xls', '.xlsx',
        '.jpg', '.jpeg', '.png', '.gif',
        '.zip', '.rar', '.txt', '.csv'
    ];

    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Type de fichier non autorisé: ${ext}`), false);
    }
};

// Configuration de multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // Limite de 50 MB par fichier
    },
    fileFilter: fileFilter
});

/**
 * POST /api/files/upload
 * Upload un ou plusieurs fichiers
 */
router.post('/upload', upload.array('files', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier fourni'
            });
        }

        // Préparer les métadonnées des fichiers
        const filesData = req.files.map(file => ({
            id: file.filename, // Nom unique du fichier
            originalName: file.originalname,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype,
            uploadDate: new Date().toISOString(),
            url: `/api/files/download/${file.filename}`
        }));

        console.log(`[FILES] ${req.files.length} fichier(s) uploadé(s)`);

        res.json({
            success: true,
            files: filesData
        });
    } catch (error) {
        console.error('[FILES] Erreur upload:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/files/download/:filename
 * Télécharge un fichier
 */
router.get('/download/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Fichier non trouvé'
            });
        }

        // Envoyer le fichier
        res.sendFile(filePath);
    } catch (error) {
        console.error('[FILES] Erreur téléchargement:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * DELETE /api/files/:filename
 * Supprime un fichier
 */
router.delete('/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(__dirname, '../uploads', filename);

        // Vérifier si le fichier existe
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                error: 'Fichier non trouvé'
            });
        }

        // Supprimer le fichier
        fs.unlinkSync(filePath);

        console.log(`[FILES] Fichier supprimé: ${filename}`);

        res.json({
            success: true,
            message: 'Fichier supprimé avec succès'
        });
    } catch (error) {
        console.error('[FILES] Erreur suppression:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * GET /api/files/list
 * Liste tous les fichiers uploadés
 */
router.get('/list', (req, res) => {
    try {
        const uploadDir = path.join(__dirname, '../uploads');

        if (!fs.existsSync(uploadDir)) {
            return res.json({
                success: true,
                files: []
            });
        }

        const files = fs.readdirSync(uploadDir).map(filename => {
            const filePath = path.join(uploadDir, filename);
            const stats = fs.statSync(filePath);

            return {
                filename: filename,
                size: stats.size,
                uploadDate: stats.mtime.toISOString(),
                url: `/api/files/download/${filename}`
            };
        });

        res.json({
            success: true,
            files: files
        });
    } catch (error) {
        console.error('[FILES] Erreur liste fichiers:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export default router;
