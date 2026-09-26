// ============================================
// 👥 Customers List
// ============================================

import customerService from '../services/customer-service.js';
import state from '../core/state.js';
import toast from '../ui/toast.js';
import { ROUTES } from '../config/constants.js';
import { formatAmount } from '../utils/currency-utils.js';
import { getInitials, debounce } from '../utils/formatter.js';
import { makeSeasonId } from '../utils/season-utils.js';
import { navigate } from '../config/routes.js';
import logger from '../utils/logger.js';

class CustomersPage {
  constructor() {
    this.allCustomers = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
  }

  async init() {
    logger.info('👥 Customers page init');

    this.listEl = document.getElementById('customerList');
    this.emptyEl = document.getElementById('emptyState');
    this.searchInput = document.getElementById('searchInput');

    this.updateSeasonLabel();
    this.setupListeners();
    await this.load();
  }

  updateSeasonLabel() {
    const season = state.get('selectedSeason') || 'Kharif';
    const year = state.get('selectedYear') || String(new Date().getFullYear());
    const el = document.getElementById('seasonSubtitle');
    if (el) el.textContent = `${season} - ${year}`;
  }

  setupListeners() {
    // Search
    this.searchInput?.addEventListener('input', debounce((e) => {
      this.searchQuery = e.target.value.trim().toLowerCase();
      this.applyFilters();
    }, 300));

    // Filter tabs
    document.querySelectorAll('[data-filter]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter;
        this.applyFilters();
      });
    });
  }

  async load() {
    try {
      this.allCustomers = await customerService.getCustomers();
      this.applyFilters();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Data load nahi hua');
    }
  }

  applyFilters() {
    let list = [...this.allCustomers];

    // Filter
    if (this.currentFilter === 'paid') {
      list = list.filter((c) => c.paymentClosed);
    } else if (this.currentFilter === 'due') {
      list = list.filter((c) => (c.due || 0) > 0 && !c.paymentClosed);
    }

    // Search
    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter((c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.mobile || '').includes(q) ||
        (c.village || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    this.render(list);
  }

  render(list) {
    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    this.listEl.innerHTML = list.map((c) => {
      const due = Math.max(0, (c.due || 0));
      const isPaid = c.paymentClosed;
      const amountText = isPaid ? 'PAID' : formatAmount(due);
      const tagClass = isPaid ? 'paid' : (due > 0 ? 'due' : 'paid');
      const tagText = isPaid ? 'PAID' : (due > 0 ? 'DUE' : 'PAID');

      return `
        <div class="customer-card" data-cust-id="${c.id}">
          <div class="customer-avatar">${getInitials(c.name)}</div>
          <div class="customer-info">
            <div class="customer-name">${this._esc(c.name)}</div>
            <div class="customer-meta">
              ${this._esc(c.village || '')} • +91 ${this._esc(c.mobile || '')}
            </div>
          </div>
          <div class="customer-right">
            <div class="customer-amount ${tagClass}">${amountText}</div>
            <span class="status-tag ${tagClass}">${tagText}</span>
          </div>
        </div>
      `;
    }).join('');

    // Click handlers
    this.listEl.querySelectorAll('[data-cust-id]').forEach((card) => {
      card.addEventListener('click', () => {
        const custId = card.dataset.custId;
        const seasonId = makeSeasonId(state.get('selectedSeason'), state.get('selectedYear'));
        navigate(ROUTES.CUSTOMER_DETAIL, { id: custId, season: seasonId });
      });
    });
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new CustomersPage();
document.addEventListener('DOMContentLoaded', () => page.init());