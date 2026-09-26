// ============================================
// ✅ Validation
// ============================================

import { VALIDATION } from '../config/constants.js';

export function isValidMobile(mobile) {
  if (!mobile) return false;
  const cleaned = String(mobile).replace(/\D/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}

export function isValidPassword(password) {
  return password && password.length >= VALIDATION.PASSWORD_MIN_LENGTH;
}

export function isValidName(name) {
  if (!name) return false;
  const trimmed = name.trim();
  return trimmed.length >= VALIDATION.NAME_MIN_LENGTH &&
         trimmed.length <= VALIDATION.NAME_MAX_LENGTH;
}

export function isValidVillage(village) {
  if (!village) return false;
  return village.trim().length >= 2 &&
         village.trim().length <= VALIDATION.VILLAGE_MAX_LENGTH;
}

export function isValidAmount(amount) {
  const num = Number(amount);
  return !isNaN(num) && num > 0;
}

export function isValidRate(rate) {
  const num = Number(rate);
  return !isNaN(num) && num >= 0 && num <= 100000;
}

export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

export function isNumeric(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

export function passwordsMatch(p1, p2) {
  return p1 === p2 && p1.length > 0;
}

export function sanitizeMobile(mobile) {
  return String(mobile || '').replace(/\D/g, '').slice(0, 10);
}

export function cleanName(name) {
  return String(name || '').trim().replace(/\s+/g, ' ');
}

export function sanitize(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function validateForm(fields) {
  const errors = {};

  for (const [name, config] of Object.entries(fields)) {
    const value = config.value;
    const rules = config.rules || [];

    for (const rule of rules) {
      switch (rule) {
        case 'required':
          if (!isRequired(value)) {
            errors[name] = `${config.label || name} zaroori hai`;
            break;
          }
          break;
        case 'mobile':
          if (value && !isValidMobile(value)) {
            errors[name] = 'Sahi 10 digit mobile number daalo';
          }
          break;
        case 'password':
          if (value && !isValidPassword(value)) {
            errors[name] = `Password kam se kam ${VALIDATION.PASSWORD_MIN_LENGTH} characters ka ho`;
          }
          break;
        case 'name':
          if (value && !isValidName(value)) {
            errors[name] = 'Sahi naam daalo';
          }
          break;
        case 'village':
          if (value && !isValidVillage(value)) {
            errors[name] = 'Sahi village daalo';
          }
          break;
        case 'amount':
          if (value !== undefined && value !== '' && !isValidAmount(value)) {
            errors[name] = 'Sahi amount daalo';
          }
          break;
      }
      if (errors[name]) break;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}