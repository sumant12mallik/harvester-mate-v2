// ============================================
// ⏱️ Work Logs Page
// ============================================

import customerService from '../services/customer-service.js';
import state from '../core/state.js';
import toast from '../ui/toast.js';
import { formatAmount } from '../utils/currency-utils.js';
import { formatDurationShort, getInitials } from '../utils/formatter.js';
import { formatDate } from '../utils/date-utils.js';
import { makeSeasonId } from '../utils/season-utils.js';
import { navigate } from '../config/routes.js';
import { ROUTES } from '../config/constants.js';
import logger from '../utils/logger.js';

class WorkPage {
  constructor() {
    this.allRecords = [];
    this.currentPeriod = 'today';
  }

  async init() {
    logger.info('⏱️ Work page init');

    this.listEl = document.getElementById('workList');
    this.emptyEl = document.getElementById('emptyState');

    this.setupListeners();
    await this.load();
  }

  setupListeners() {
    document.querySelectorAll('#periodTabs .tab-segment').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#periodTabs .tab-segment').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentPeriod = tab.dataset.period;
        this.render();
      });
    });
  }

  async load() {
    try {
      const customers = await customerService.getCustomers();
      this.allRecords = customers
        .filter((c) => (c.time2WSec || 0) > 0 || (c.time4WSec || 0) > 0)
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Data load nahi hua');
    }
  }

  filterByPeriod(records) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    if (this.currentPeriod === 'today') {
      return records.filter((r) => (r.createdAt || 0) >= today);
    }
    if (this.currentPeriod === 'week') {
      const weekAgo = today - 7 * 24 * 60 * 60 * 1000;
      return records.filter((r) => (r.createdAt || 0) >= weekAgo);
    }
    if (this.currentPeriod === 'month') {
      const monthAgo = today - 30 * 24 * 60 * 60 * 1000;
      return records.filter((r) => (r.createdAt || 0) >= monthAgo);
    }
    return records;
  }

  render() {
    const list = this.filterByPeriod(this.allRecords);

    // Stats
    const totalTime = list.reduce((s, r) => s + (r.time2WSec || 0) + (r.time4WSec || 0), 0);
    const totalAmount = list.reduce((s, r) => s + (r.totalAmount || 0), 0);

    const statTime = document.getElementById('statTime');
    const statRecords = document.getElementById('statRecords');
    const statAmount = document.getElementById('statAmount');
    if (statTime) statTime.textContent = formatDurationShort(totalTime);
    if (statRecords) statRecords.textContent = list.length;
    if (statAmount) statAmount.textContent = formatAmount(totalAmount);

    // List
    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    this.listEl.innerHTML = list.map((r) => `
      <div class="customer-card" data-cust-id="${r.id}" data-season="${r.seasonId}">
        <div class="customer-avatar">${getInitials(r.name)}</div>
        <div class="customer-info">
          <div class="customer-name">${this._esc(r.name)}</div>
          <div class="customer-meta">
            ${formatDate(r.createdAt, 'medium')} • 2W ${formatDurationShort(r.time2WSec || 0)} • 4W ${formatDurationShort(r.time4WSec || 0)}
          </div>
        </div>
        <div class="customer-right">
          <div class="customer-amount paid">${formatAmount(r.totalAmount || 0)}</div>
        </div>
      </div>
    `).join('');

    this.listEl.querySelectorAll('[data-cust-id]').forEach((card) => {
      card.addEventListener('click', () => {
        navigate(ROUTES.CUSTOMER_DETAIL, {
          id: card.dataset.custId,
          season: card.dataset.season
        });
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

const page = new WorkPage();
document.addEventListener('DOMContentLoaded', () => page.init());