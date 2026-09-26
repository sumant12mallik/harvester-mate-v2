// ============================================
// 🔐 Login Page
// ============================================

import authService from '../services/auth-service.js';
import toast from '../ui/toast.js';
import { ROUTES } from '../config/constants.js';
import { sanitizeMobile } from '../utils/validation.js';
import { getParam, getDashboardForRole } from '../config/routes.js';
import logger from '../utils/logger.js';

// If already logged in — redirect
authService.onAuthChange(async (user) => {
  if (user) {
    const data = await authService.getUserData(user.uid);
    if (data) {
      if (data.role === 'owner' && !data.approved) {
        window.location.href = ROUTES.APPROVAL_PENDING;
      } else {
        window.location.href = getDashboardForRole(data.role);
      }
    }
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('loginForm');
  const btn = document.getElementById('loginBtn');
  const errorEl = document.getElementById('loginError');
  const togglePass = document.getElementById('togglePassword');
  const passInput = document.getElementById('password');
  const mobileInput = document.getElementById('mobile');

  // Toggle password
  if (togglePass && passInput) {
    togglePass.addEventListener('click', () => {
      const isPass = passInput.type === 'password';
      passInput.type = isPass ? 'text' : 'password';
      togglePass.textContent = isPass ? '🙈' : '👁️';
    });
  }

  // Only digits
  mobileInput.addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    if (e.target.value.length === 10 && !passInput.value) {
      passInput.focus();
    }
  });

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.classList.remove('active');

    const mobile = sanitizeMobile(mobileInput.value);
    const password = passInput.value;

    if (mobile.length !== 10) {
      errorEl.textContent = 'Sahi 10 digit mobile number daalo';
      errorEl.classList.add('active');
      return;
    }

    if (!password) {
      errorEl.textContent = 'Password daalo';
      errorEl.classList.add('active');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Logging in...';

    try {
      const result = await authService.login(mobile, password);

      if (!result.success) {
        if (result.error === 'pending_approval') {
          toast.warning('Aapka account approval pending hai');
          setTimeout(() => {
            window.location.href = ROUTES.APPROVAL_PENDING;
          }, 1000);
          return;
        }

        errorEl.textContent = result.error;
        errorEl.classList.add('active');
        btn.disabled = false;
        btn.textContent = 'SIGN IN';
        return;
      }

      toast.success(`Welcome, ${result.userData.name}!`);

      const redirect = getParam('redirect');
      const target = redirect
        ? decodeURIComponent(redirect)
        : getDashboardForRole(result.userData.role);

      setTimeout(() => {
        window.location.href = target;
      }, 600);

    } catch (err) {
      logger.error('Login error:', err);
      errorEl.textContent = 'Network error. Internet check karo.';
      errorEl.classList.add('active');
      btn.disabled = false;
      btn.textContent = 'SIGN IN';
    }
  });

  mobileInput.focus();
});