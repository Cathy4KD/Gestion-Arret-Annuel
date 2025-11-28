/**
 * Module de validation côté client
 * Fournit des fonctions de validation réutilisables pour les formulaires
 */

import { showWarning } from './error-handler.js';

/**
 * Règles de validation communes
 */
export const ValidationRules = {
  required: (value, fieldName) => {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return `${fieldName} est requis`;
    }
    return null;
  },

  minLength: (min) => (value, fieldName) => {
    if (value && value.length < min) {
      return `${fieldName} doit contenir au moins ${min} caractères`;
    }
    return null;
  },

  maxLength: (max) => (value, fieldName) => {
    if (value && value.length > max) {
      return `${fieldName} ne peut pas dépasser ${max} caractères`;
    }
    return null;
  },

  email: (value, fieldName) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      return `${fieldName} doit être une adresse email valide`;
    }
    return null;
  },

  phone: (value, fieldName) => {
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (value && !phoneRegex.test(value)) {
      return `${fieldName} doit être un numéro de téléphone valide`;
    }
    return null;
  },

  number: (value, fieldName) => {
    if (value && isNaN(value)) {
      return `${fieldName} doit être un nombre`;
    }
    return null;
  },

  integer: (value, fieldName) => {
    if (value && (!Number.isInteger(Number(value)))) {
      return `${fieldName} doit être un nombre entier`;
    }
    return null;
  },

  min: (min) => (value, fieldName) => {
    if (value && Number(value) < min) {
      return `${fieldName} doit être supérieur ou égal à ${min}`;
    }
    return null;
  },

  max: (max) => (value, fieldName) => {
    if (value && Number(value) > max) {
      return `${fieldName} doit être inférieur ou égal à ${max}`;
    }
    return null;
  },

  pattern: (regex, message) => (value, fieldName) => {
    if (value && !regex.test(value)) {
      return message || `${fieldName} ne correspond pas au format attendu`;
    }
    return null;
  },

  date: (value, fieldName) => {
    if (value && isNaN(Date.parse(value))) {
      return `${fieldName} doit être une date valide`;
    }
    return null;
  },

  url: (value, fieldName) => {
    try {
      if (value) new URL(value);
      return null;
    } catch {
      return `${fieldName} doit être une URL valide`;
    }
  },

  oneOf: (options) => (value, fieldName) => {
    if (value && !options.includes(value)) {
      return `${fieldName} doit être l'une des valeurs suivantes: ${options.join(', ')}`;
    }
    return null;
  }
};

/**
 * Classe de validation de formulaire
 */
export class FormValidator {
  constructor(formElement) {
    this.form = formElement;
    this.fields = new Map();
    this.errors = new Map();
    this.isSubmitting = false;
  }

  /**
   * Ajoute un champ à valider
   * @param {string} fieldName - Nom du champ (attribut name)
   * @param {string} label - Label du champ pour les messages
   * @param {Array} rules - Tableau de règles de validation
   */
  addField(fieldName, label, rules = []) {
    this.fields.set(fieldName, { label, rules });

    // Ajouter validation en temps réel
    const element = this.form.elements[fieldName];
    if (element) {
      element.addEventListener('blur', () => this.validateField(fieldName));
      element.addEventListener('input', () => this.clearFieldError(fieldName));
    }

    return this;
  }

  /**
   * Valide un champ spécifique
   * @param {string} fieldName - Nom du champ
   * @returns {boolean} - True si valide, false sinon
   */
  validateField(fieldName) {
    const field = this.fields.get(fieldName);
    if (!field) return true;

    const element = this.form.elements[fieldName];
    if (!element) return true;

    const value = this.getFieldValue(element);

    // Appliquer toutes les règles
    for (const rule of field.rules) {
      const error = rule(value, field.label);
      if (error) {
        this.setFieldError(fieldName, error);
        return false;
      }
    }

    this.clearFieldError(fieldName);
    return true;
  }

  /**
   * Obtient la valeur d'un champ
   */
  getFieldValue(element) {
    if (element.type === 'checkbox') {
      return element.checked;
    } else if (element.type === 'radio') {
      const selected = this.form.querySelector(`input[name="${element.name}"]:checked`);
      return selected ? selected.value : '';
    } else {
      return element.value;
    }
  }

  /**
   * Définit une erreur pour un champ
   */
  setFieldError(fieldName, message) {
    this.errors.set(fieldName, message);

    const element = this.form.elements[fieldName];
    if (element) {
      element.classList.add('error', 'invalid');

      // Créer ou mettre à jour le message d'erreur
      let errorElement = element.parentNode.querySelector('.error-message');
      if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.style.cssText = 'color: #e74c3c; font-size: 0.875rem; margin-top: 0.25rem;';
        element.parentNode.appendChild(errorElement);
      }
      errorElement.textContent = message;
    }
  }

  /**
   * Efface l'erreur d'un champ
   */
  clearFieldError(fieldName) {
    this.errors.delete(fieldName);

    const element = this.form.elements[fieldName];
    if (element) {
      element.classList.remove('error', 'invalid');

      const errorElement = element.parentNode.querySelector('.error-message');
      if (errorElement) {
        errorElement.remove();
      }
    }
  }

  /**
   * Valide tous les champs du formulaire
   * @returns {boolean} - True si tous les champs sont valides
   */
  validateAll() {
    this.errors.clear();
    let isValid = true;

    for (const [fieldName] of this.fields) {
      if (!this.validateField(fieldName)) {
        isValid = false;
      }
    }

    return isValid;
  }

  /**
   * Obtient toutes les erreurs
   * @returns {Map} - Map des erreurs par champ
   */
  getErrors() {
    return new Map(this.errors);
  }

  /**
   * Obtient les données du formulaire validées
   * @returns {Object|null} - Objet avec les données ou null si invalide
   */
  getData() {
    if (!this.validateAll()) {
      return null;
    }

    const data = {};
    for (const [fieldName] of this.fields) {
      const element = this.form.elements[fieldName];
      if (element) {
        data[fieldName] = this.getFieldValue(element);
      }
    }

    return data;
  }

  /**
   * Réinitialise le formulaire et les erreurs
   */
  reset() {
    this.form.reset();
    this.errors.clear();

    for (const [fieldName] of this.fields) {
      this.clearFieldError(fieldName);
    }
  }

  /**
   * Empêche les soumissions multiples
   * @param {Function} handler - Fonction à appeler lors de la soumission
   */
  onSubmit(handler) {
    this.form.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Empêcher les soumissions multiples
      if (this.isSubmitting) {
        showWarning('Soumission en cours, veuillez patienter...');
        return;
      }

      // Valider le formulaire
      if (!this.validateAll()) {
        showWarning('Veuillez corriger les erreurs dans le formulaire');
        return;
      }

      // Obtenir les données
      const data = this.getData();
      if (!data) return;

      try {
        this.isSubmitting = true;
        this.setSubmitButtonState(true);

        // Appeler le handler
        await handler(data);

      } catch (error) {
        console.error('Erreur lors de la soumission:', error);
        throw error;
      } finally {
        this.isSubmitting = false;
        this.setSubmitButtonState(false);
      }
    });
  }

  /**
   * Active/désactive le bouton de soumission
   */
  setSubmitButtonState(disabled) {
    const submitButton = this.form.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = disabled;
      if (disabled) {
        submitButton.classList.add('loading');
        submitButton.dataset.originalText = submitButton.textContent;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
      } else {
        submitButton.classList.remove('loading');
        if (submitButton.dataset.originalText) {
          submitButton.textContent = submitButton.dataset.originalText;
        }
      }
    }
  }
}

/**
 * Fonction utilitaire pour valider rapidement un formulaire
 * @param {HTMLFormElement} form - Formulaire à valider
 * @param {Object} fields - Configuration des champs { nom: { label, rules } }
 * @returns {FormValidator} - Instance du validateur
 */
export function createValidator(form, fields) {
  const validator = new FormValidator(form);

  for (const [fieldName, config] of Object.entries(fields)) {
    validator.addField(fieldName, config.label, config.rules);
  }

  return validator;
}

/**
 * Sanitize HTML pour éviter XSS
 */
export function sanitizeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Escape HTML
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validation d'un objet selon un schéma
 */
export function validateObject(obj, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];

    for (const rule of rules) {
      const error = rule(value, field);
      if (error) {
        errors.push({ field, message: error });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export default {
  ValidationRules,
  FormValidator,
  createValidator,
  sanitizeHtml,
  escapeHtml,
  validateObject
};
