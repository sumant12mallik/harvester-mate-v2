// ============================================
// 👤 Drivers List
// ============================================

import driverService from '../services/driver-service.js';
import toast from '../ui/toast.js';
import { formatAmount } from '../utils/currency-utils.js';
import { getInitials, debounce } from '../utils/formatter.js';
import logger from '../utils/logger.js';

class DriversPage {
  constructor() {
    this.allDrivers = [];
    this.searchQuery = '';
  }

  async init() {
    logger.info('👤 Drivers page init');
    this.listEl = document.getElementById('driverList');
    this.emptyEl = document.getElementById('emptyState');
    this.searchInput = document.getElementById('searchInput');
    this.countEl = document.getElementById('driverCount');

    this.setupListeners();
    await this.load();
  }

  setupListeners() {
    this.searchInput?.addEventListener('input', debounce((e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.render();
    }, 300));
  }

  async load() {
    try {
      this.allDrivers = await driverService.getDrivers();
      if (this.countEl) {
        this.countEl.textContent = `${this.allDrivers.length} driver${this.allDrivers.length === 1 ? '' : 's'}`;
      }
      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Load fail');
    }
  }

  render() {
    let list = [...this.allDrivers];

    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter((d) =>
        (d.name || '').toLowerCase().includes(q) ||
        (d.mobile || '').includes(q)
      );
    }

    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    this.listEl.innerHTML = list.map((d) => {
      const statusClass = d.status === 'Active' ? 'active'
        : d.status === 'On Leave' ? 'leave' : 'inactive';

      return `
        <div class="driver-card">
          <div class="driver-avatar">${getInitials(d.name)}</div>
          <div class="driver-info">
            <div class="driver-name">${this._esc(d.name)}</div>
            <div class="driver-meta">
              <span class="driver-meta-line">📱 ${this._esc(d.mobile || '')}</span>
              ${d.assignedTo ? `<span class="driver-meta-line">🚜 ${this._esc(d.assignedTo)}</span>` : ''}
            </div>
          </div>
          <div class="driver-right">
            <span class="status-tag ${statusClass}">${this._esc(d.status || 'Active')}</span>
            ${d.assignedHours ? `<div class="driver-hours">${d.assignedHours} hrs</div>` : ''}
            ${d.totalPaid ? `<div class="driver-amount">${formatAmount(d.totalPaid)}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new DriversPage();
document.addEventListener('DOMContentLoaded', () => page.init());