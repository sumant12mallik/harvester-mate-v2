// ============================================
// 👤 User Home Page
// ============================================

import { auth } from '../config/firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import { ROUTES } from '../config/constants.js';
import { getInitials } from '../utils/formatter.js';
import { navigate } from '../config/routes.js';
import logger from '../utils/logger.js';

class UserHomePage {
  init() {
    logger.info('👤 User home init');

    onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate(ROUTES.LOGIN);
        return;
      }
      this.loadUser();
    });

    this.setupListeners();

    setTimeout(() => {
      const data = JSON.parse(localStorage.getItem('hm_user_data') || '{}');
      if (data.name) toast.success(`Welcome, ${data.name}! 🌾`);
    }, 800);
  }

  loadUser() {
    const data = JSON.parse(localStorage.getItem('hm_user_data') || '{}');
    const name = data.name || 'User';

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('welcomeName', `Hello, ${name.split(' ')[0]}`);
    set('userName', name);
    set('userAvatar', getInitials(name));
  }

  setupListeners() {
    document.getElementById('settingsBtn')?.addEventListener('click', () => {
      navigate(ROUTES.SETTINGS);
    });

    const logoutHandler = async () => {
      const ok = await modal.confirm({
        title: 'Logout',
        message: 'Logout karna hai?',
        confirmText: 'Logout',
        confirmVariant: 'danger'
      });
      if (!ok) return;

      await signOut(auth);
      localStorage.clear();
      navigate(ROUTES.LOGIN);
    };

    document.getElementById('logoutBtn')?.addEventListener('click', logoutHandler);
    document.getElementById('logoutBtn2')?.addEventListener('click', logoutHandler);
  }
}

const page = new UserHomePage();
document.addEventListener('DOMContentLoaded', () => page.init());