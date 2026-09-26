// ============================================
// 🤝 Dealer Ledger Page
// ============================================

import state from '../core/state.js';
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import firestoreService from '../services/firestore-service.js';
import { formatAmount } from '../utils/currency-utils.js';
import { getInitials, debounce } from '../utils/formatter.js';
import { formatDate } from '../utils/date-utils.js';
import { makeSeasonId } from '../utils/season-utils.js';
import logger from '../utils/logger.js';

class DealerPage {
  constructor() {
    this.entries = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
  }

  async init() {
    logger.info('🤝 Dealer page init');

    this.listEl = document.getElementById('dealerList');
    this.emptyEl = document.getElementById('emptyState');
    this.searchInput = document.getElementById('searchInput');

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
    return `harvesters/${ownerId}/seasons/${seasonId}/dealer_ledger`;
  }

  setupListeners() {
    document.getElementById('addDealerBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.addDealer();
    });

    this.searchInput?.addEventListener('input', debounce((e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.render();
    }, 300));

    document.querySelectorAll('#dealerTabs .pill-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#dealerTabs .pill-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter;
        this.render();
      });
    });
  }

  async load() {
    try {
      this.entries = await firestoreService.getAll(this._path(), {
        orderBy: 'createdAt',
        orderDir: 'desc'
      });
      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
    }
  }

  render() {
    let list = [...this.entries];

    if (this.currentFilter === 'paid') {
      list = list.filter((e) => e.status === 'paid');
    } else if (this.currentFilter === 'due') {
      list = list.filter((e) => e.status === 'due');
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter((e) =>
        (e.dealerName || '').toLowerCase().includes(q) ||
        (e.mobile || '').includes(q)
      );
    }

    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    this.listEl.innerHTML = list.map((e) => `
      <div class="dealer-card">
        <div class="dealer-avatar">${getInitials(e.dealerName)}</div>
        <div class="dealer-info">
          <div class="dealer-name">${this._esc(e.dealerName)}</div>
          <div class="dealer-meta">
            📱 ${this._esc(e.mobile || '')}
            ${e.location ? ' • ' + this._esc(e.location) : ''}
          </div>
        </div>
        <div class="dealer-right">
          <div class="dealer-amount ${e.status === 'paid' ? 'paid' : 'due'}">${formatAmount(e.amount)}</div>
          <span class="status-tag ${e.status === 'paid' ? 'paid' : 'due'}">${(e.status || 'due').toUpperCase()}</span>
        </div>
      </div>
    `).join('');
  }

  async addDealer() {
    const name = await modal.prompt({
      title: 'Dealer Name',
      confirmText: 'Next'
    });
    if (!name) return;

    const mobile = await modal.prompt({
      title: 'Mobile',
      inputType: 'tel',
      confirmText: 'Next'
    });
    if (!mobile) return;

    const amount = await modal.prompt({
      title: 'Amount (₹)',
      inputType: 'number',
      confirmText: 'Next'
    });
    if (!amount) return;

    const status = await modal.prompt({
      title: 'Status',
      message: 'paid ya due',
      defaultValue: 'paid',
      confirmText: 'Save'
    });

    try {
      await firestoreService.create(this._path(), {
        dealerName: name.trim(),
        mobile: String(mobile).replace(/\D/g, '').slice(0, 10),
        amount: Number(amount),
        status: (status || 'paid').toLowerCase().includes('due') ? 'due' : 'paid',
        location: '',
        createdAt: Date.now()
      });
      toast.success('Dealer added!');
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

const page = new DealerPage();
document.addEventListener('DOMContentLoaded', () => page.init());