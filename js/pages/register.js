// ============================================
// 📝 Register Page
// ============================================

import authService from '../services/auth-service.js';
import whatsappService from '../services/whatsapp-service.js';
import toast from '../ui/toast.js';
import { ROUTES } from '../config/constants.js';
import { sanitizeMobile, passwordsMatch, isValidPassword } from '../utils/validation.js';
import logger from '../utils/logger.js';

let selectedRole = 'user';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  const btn = document.getElementById('registerBtn');
  const errorEl = document.getElementById('registerError');
  const ownerNote = document.getElementById('ownerNote');
  const roleToggle = document.getElementById('roleToggle');
  const mobileInput = document.getElementById('mobile');

  // Role toggle
  roleToggle.addEventListener('click', (e) => {
    const option = e.target.closest('.role-option');
    if (!option) return;

    roleToggle.querySelectorAll('.role-option').forEach((o) => o.classList.remove('active'));
    option.classList.add('active');
    selectedRole = option.dataset.role;

    if (ownerNote) {
      ownerNote.style.display = selectedRole === 'owner' ? 'block' : 'none';
    }
  });

  // Mobile digits only
  mobileInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('active');

    const name = document.getElementById('name').value.trim();
    const mobile = sanitizeMobile(mobileInput.value);
    const village = document.getElementById('village').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!name || name.length < 2) return showError('Sahi naam daalo');
    if (mobile.length !== 10) return showError('Sahi 10 digit mobile number daalo');
    if (!isValidPassword(password)) return showError('Password kam se kam 6 characters ka ho');
    if (!passwordsMatch(password, confirmPassword)) return showError('Passwords match nahi kar rahe');

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    try {
      const result = await authService.register({
        name, mobile, village, password, role: selectedRole
      });

      if (!result.success) {
        showError(result.error || 'Registration fail ho gaya');
        btn.disabled = false;
        btn.textContent = 'Register';
        return;
      }

      // Welcome WhatsApp message
      try {
        whatsappService.sendWelcomeMessage({ name, mobile, role: selectedRole });
      } catch (e) {
        logger.warn('Welcome msg failed:', e);
      }

      toast.success('Registration successful!');

      setTimeout(() => {
        if (selectedRole === 'owner') {
          window.location.href = ROUTES.APPROVAL_PENDING;
        } else {
          window.location.href = ROUTES.USER_HOME;
        }
      }, 1200);

    } catch (err) {
      logger.error('Register error:', err);
      showError('Network error. Dobara try karo.');
      btn.disabled = false;
      btn.textContent = 'Register';
    }
  });

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.add('active');
    errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
});