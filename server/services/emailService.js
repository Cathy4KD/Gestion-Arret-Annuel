// server/services/emailService.js - Service d'envoi d'emails via Outlook

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

/**
 * Envoie un email avec un avis syndical en pièce jointe via Outlook COM automation
 * @param {Object} options - Options d'envoi
 * @param {string} options.to - Adresse email du destinataire
 * @param {string} options.filePath - Chemin vers le fichier DOCX
 * @param {string} options.fileName - Nom du fichier
 * @param {Object} options.avisData - Données de l'avis syndical
 * @returns {Promise<Object>} - Résultat de l'envoi
 */
export async function envoyerAvisSyndical({ to, filePath, fileName, avisData }) {
    try {
        console.log('[EMAIL] 📧 Préparation de l\'email via Outlook...');

        // Vérifier que le fichier existe
        if (!fs.existsSync(filePath)) {
            throw new Error(`Le fichier n'existe pas: ${filePath}`);
        }

        // Préparer le contenu HTML de l'email
        const htmlBody = `
<html>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h2 style="color: #667eea;">Avis Syndical</h2>

    <p>Bonjour,</p>

    <p>Veuillez trouver ci-joint l'avis syndical pour:</p>

    <table style="border-collapse: collapse; margin: 20px 0;">
        <tr>
            <td style="padding: 8px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd;">Entrepreneur:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${avisData.nomEntrepreneur || 'N/A'}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd;">Date de l'avis:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${avisData.dateAvisFormatted || avisData.dateAvis || 'N/A'}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd;">Type:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${avisData.typesString || 'N/A'}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd;">Période:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">Du ${avisData.dateDebutFormatted || avisData.dateDebut || 'N/A'} au ${avisData.dateFinFormatted || avisData.dateFin || 'N/A'}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold; background: #f5f5f5; border: 1px solid #ddd;">Heures-homme:</td>
            <td style="padding: 8px; border: 1px solid #ddd;">${avisData.heuresHomme || '0'}</td>
        </tr>
    </table>

    ${avisData.descriptionTravaux ? `
    <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #667eea;">Description des travaux:</h3>
        <p>${avisData.descriptionTravaux.replace(/\n/g, '<br>')}</p>
    </div>
    ` : ''}

    <p style="margin-top: 30px;">Cordialement,</p>
    <p><strong>Gestionnaire d'Arrêt d'Aciérie</strong></p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
    <p style="font-size: 12px; color: #999;">
        Ce message a été généré automatiquement par le système de gestion d'arrêt d'aciérie.
    </p>
</body>
</html>
        `.replace(/"/g, '""').replace(/\n/g, ' ');

        const subject = `Avis Syndical - ${avisData.nomEntrepreneur || 'Entrepreneur'}`;

        // Créer le script PowerShell pour envoyer via Outlook
        const psScript = `
try {
    # Créer l'objet Outlook
    $outlook = New-Object -ComObject Outlook.Application

    # Créer un nouvel email
    $mail = $outlook.CreateItem(0)

    # Configurer l'email
    $mail.To = "${to}"
    $mail.Subject = "${subject.replace(/"/g, '""')}"
    $mail.HTMLBody = "${htmlBody}"

    # Ajouter la pièce jointe
    $mail.Attachments.Add("${filePath.replace(/\\/g, '\\\\')}")

    # Envoyer l'email
    $mail.Send()

    Write-Output "SUCCESS"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    exit 1
}
        `;

        console.log('[EMAIL] 📤 Envoi de l\'email à:', to);
        console.log('[EMAIL] 📎 Pièce jointe:', fileName);

        // Exécuter le script PowerShell
        const { stdout, stderr } = await execPromise(
            `powershell -ExecutionPolicy Bypass -Command "${psScript.replace(/"/g, '\\"')}"`,
            { timeout: 30000 }
        );

        if (stdout.includes('SUCCESS')) {
            console.log('[EMAIL] ✅ Email envoyé avec succès via Outlook');
            return {
                success: true,
                message: 'Email envoyé avec succès via Outlook!',
                method: 'outlook-com'
            };
        } else {
            throw new Error(stdout || stderr || 'Erreur inconnue lors de l\'envoi');
        }

    } catch (error) {
        console.error('[EMAIL] ❌ Erreur lors de l\'envoi:', error);

        let errorMessage = error.message;

        if (errorMessage.includes('Outlook.Application')) {
            errorMessage = 'Outlook n\'est pas installé ou n\'est pas accessible. Veuillez vérifier qu\'Outlook est installé et que vous êtes connecté.';
        } else if (errorMessage.includes('permission')) {
            errorMessage = 'Permission refusée. Veuillez autoriser l\'application à utiliser Outlook.';
        }

        return {
            success: false,
            error: errorMessage
        };
    }
}

/**
 * Teste la configuration email (vérifie que Outlook est accessible)
 * @returns {Promise<boolean>}
 */
export async function testerConfigurationEmail() {
    try {
        const psScript = `
try {
    $outlook = New-Object -ComObject Outlook.Application
    Write-Output "SUCCESS"
} catch {
    Write-Output "ERROR: $($_.Exception.Message)"
    exit 1
}
        `;

        const { stdout } = await execPromise(
            `powershell -ExecutionPolicy Bypass -Command "${psScript}"`,
            { timeout: 5000 }
        );

        if (stdout.includes('SUCCESS')) {
            console.log('[EMAIL] ✅ Outlook est accessible');
            return true;
        } else {
            console.log('[EMAIL] ⚠️ Outlook n\'est pas accessible');
            return false;
        }
    } catch (error) {
        console.error('[EMAIL] ❌ Erreur lors du test:', error.message);
        return false;
    }
}
