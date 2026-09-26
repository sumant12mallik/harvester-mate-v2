// ============================================
// ⛽ Diesel Page
// ============================================

import state from '../core/state.js';
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import firestoreService from '../services/firestore-service.js';
import { formatAmount } from '../utils/currency-utils.js';
import { formatDate } from '../utils/date-utils.js';
import { makeSeasonId } from '../utils/season-utils.js';
import logger from '../utils/logger.js';

class DieselPage {
  constructor() {
    this.entries = [];
  }

  async init() {
    logger.info('⛽ Diesel page init');

    this.listEl = document.getElementById('dieselList');
    this.emptyEl = document.getElementById('emptyState');

    this.updateSeasonLabel();
    this.setupListeners();
    await this.load();
  }

  updateSeasonLabel() {
    const season = state.get('selectedSeason') || 'Kharif';
    const year = state.get('selectedYear') || String(new Date().getFullYear());
    const el = document.getElementById('seasonLabel');
    if (el) el.textContent = `${season} - ${year}`;
  }

  _path() {
    const ownerId = state.get('user')?.uid;
    const seasonId = makeSeasonId(state.get('selectedSeason'), state.get('selectedYear'));
    return `harvesters/${ownerId}/seasons/${seasonId}/diesel`;
  }

  setupListeners() {
    document.getElementById('addDieselBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.addEntry();
    });
  }

  async load() {
    try {
      this.entries = await firestoreService.getAll(this._path(), {
        orderBy: 'createdAt',
        orderDir: 'desc'
      });
      this.updateStats();
      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
    }
  }

  updateStats() {
    const liters = this.entries.reduce((s, e) => s + (e.liters || 0), 0);
    const cost = this.entries.reduce((s, e) => s + (e.totalCost || 0), 0);

    const l = document.getElementById('totalLiters');
    const c = document.getElementById('totalCost');
    if (l) l.textContent = `${liters.toFixed(1)} L`;
    if (c) c.textContent = formatAmount(cost);
  }

  render() {
    const list = [...this.entries];

    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    this.listEl.innerHTML = list.map((e) => `
      <div class="diesel-entry">
        <div class="diesel-entry-icon">⛽</div>
        <div class="diesel-entry-info">
          <div class="diesel-entry-title">${e.liters} L × ₹${e.ratePerLiter}</div>
          <div class="diesel-entry-meta">
            ${formatDate(e.createdAt || e.timestamp, 'medium')}
            ${e.note ? ' • ' + this._esc(e.note) : ''}
          </div>
        </div>
        <div>
          <div class="diesel-entry-amount">${formatAmount(e.totalCost)}</div>
          <div class="diesel-entry-liters">${e.liters} L</div>
        </div>
      </div>
    `).join('');
  }

  async addEntry() {
    const liters = await modal.prompt({
      title: 'Liters',
      inputType: 'number',
      confirmText: 'Next'
    });
    if (!liters || Number(liters) <= 0) return;

    const rate = await modal.prompt({
      title: 'Rate per Liter (₹)',
      defaultValue: '90',
      inputType: 'number',
      confirmText: 'Next'
    });
    if (!rate || Number(rate) <= 0) return;

    const note = await modal.prompt({
      title: 'Note (Optional)',
      confirmText: 'Save'
    });

    const l = Number(liters);
    const r = Number(rate);

    try {
      await firestoreService.create(this._path(), {
        liters: l,
        ratePerLiter: r,
        totalCost: Math.round(l * r),
        note: note || '',
        timestamp: Date.now()
      });
      toast.success('Diesel entry added!');
      await this.load();
    } catch (e) {
      toast.error('Add fail');
    }
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new DieselPage();
document.addEventListener('DOMContentLoaded', () => page.init());