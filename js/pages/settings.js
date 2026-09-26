// ============================================
// ⚙️ Settings Page
// ============================================

import state from '../core/state.js';
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import theme from '../ui/theme.js';
import authService from '../services/auth-service.js';
import reportService from '../services/report-service.js';
import { ROUTES } from '../config/constants.js';
import { formatAmount } from '../utils/currency-utils.js';
import { getInitials, formatRole } from '../utils/formatter.js';
import { downloadFile } from '../utils/helpers.js';
import { navigate } from '../config/routes.js';
import logger from '../utils/logger.js';

class SettingsPage {
  async init() {
    logger.info('⚙️ Settings init');

    await this.loadOwner();
    this.setupListeners();
  }

  async loadOwner() {
    const userData = state.get('userData') || (await this.fetchUserData());
    if (!userData) return;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('ownerAvatar', getInitials(userData.name));
    set('ownerName', userData.name || 'Harvester Owner');
    set('ownerRole', formatRole(userData.role));
  }

  async fetchUserData() {
    const user = authService.getCurrentUser();
    if (!user) return null;
    const data = await authService.getUserData(user.uid);
    if (data) {
      state.set('userData', data);
      localStorage.setItem('hm_user_data', JSON.stringify(data));
    }
    return data;
  }

  setupListeners() {
    document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());

    // Theme toggle
    document.getElementById('themeRow')?.addEventListener('click', () => {
      const newTheme = theme.toggle();
      const el = document.getElementById('themeValue');
      if (el) el.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
      toast.success(`${newTheme} theme`);
    });

    // Export
    document.getElementById('exportRow')?.addEventListener('click', async () => {
      try {
        const csv = await reportService.exportCustomersCSV();
        downloadFile(csv, `HarvesterMate_${Date.now()}.csv`, 'text/csv');
        toast.success('Data exported!');
      } catch (e) {
        toast.error('Export fail');
      }
    });
  }

  async logout() {
    const ok = await modal.confirm({
      title: 'Logout',
      message: 'Logout karna hai?',
      confirmText: 'Logout',
      confirmVariant: 'danger'
    });
    if (!ok) return;

    await authService.logout();
    localStorage.clear();
    navigate(ROUTES.LOGIN);
  }
}

const page = new SettingsPage();
document.addEventListener('DOMContentLoaded', () => page.init());