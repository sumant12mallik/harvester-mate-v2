// ============================================
// 💵 Expense Page
// ============================================

import state from '../core/state.js';
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import firestoreService from '../services/firestore-service.js';
import { formatAmount } from '../utils/currency-utils.js';
import { formatDate } from '../utils/date-utils.js';
import { makeSeasonId } from '../utils/season-utils.js';
import logger from '../utils/logger.js';

const CATEGORY_META = {
  diesel: { icon: '⛽', label: 'Diesel', color: '#FFA726' },
  repair: { icon: '🔧', label: 'Repair', color: '#4A9EFF' },
  parts: { icon: '📦', label: 'Parts', color: '#9C6FFF' },
  driver: { icon: '👤', label: 'Driver Payment', color: '#00FF88' },
  other: { icon: '💰', label: 'Other', color: '#7A8BA8' }
};

class ExpensePage {
  constructor() {
    this.expenses = [];
    this.currentCategory = 'all';
  }

  async init() {
    logger.info('💵 Expense page init');

    this.listEl = document.getElementById('expenseList');
    this.emptyEl = document.getElementById('emptyState');
    this.totalEl = document.getElementById('totalExpense');
    this.categorySummaryEl = document.getElementById('categorySummary');

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
    return `harvesters/${ownerId}/seasons/${seasonId}/expenses`;
  }

  setupListeners() {
    document.getElementById('addExpenseBtn')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.addExpense();
    });

    document.querySelectorAll('[data-category]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-category]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentCategory = tab.dataset.category;
        this.render();
      });
    });
  }

  async load() {
    try {
      this.expenses = await firestoreService.getAll(this._path(), {
        orderBy: 'createdAt',
        orderDir: 'desc'
      });
      this.updateStats();
      this.renderCategorySummary();
      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
    }
  }

  updateStats() {
    const total = this.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    if (this.totalEl) this.totalEl.textContent = formatAmount(total);
  }

  renderCategorySummary() {
    if (!this.categorySummaryEl) return;

    const sums = {};
    Object.keys(CATEGORY_META).forEach((k) => (sums[k] = 0));
    this.expenses.forEach((e) => {
      const cat = e.category || 'other';
      sums[cat] = (sums[cat] || 0) + (e.amount || 0);
    });

    this.categorySummaryEl.innerHTML = Object.entries(CATEGORY_META).map(([key, meta]) => `
      <div class="category-summary-item" data-cat="${key}">
        <div class="category-summary-icon">${meta.icon}</div>
        <div class="category-summary-value" style="color:${meta.color};">${formatAmount(sums[key])}</div>
        <div class="category-summary-label">${meta.label}</div>
      </div>
    `).join('');
  }

  render() {
    let list = [...this.expenses];
    if (this.currentCategory !== 'all') {
      list = list.filter((e) => (e.category || 'other') === this.currentCategory);
    }

    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    this.listEl.innerHTML = list.map((e) => {
      const meta = CATEGORY_META[e.category] || CATEGORY_META.other;
      return `
        <div class="expense-card">
          <div class="expense-icon ${e.category || 'other'}">${meta.icon}</div>
          <div class="expense-info">
            <div class="expense-title">${this._esc(e.note || meta.label)}</div>
            <div class="expense-meta">${formatDate(e.createdAt || e.timestamp, 'medium')}</div>
          </div>
          <div class="expense-amount">${formatAmount(e.amount)}</div>
        </div>
      `;
    }).join('');
  }

  async addExpense() {
    const category = await modal.prompt({
      title: 'Category',
      message: 'diesel / repair / parts / driver / other',
      defaultValue: 'other',
      confirmText: 'Next'
    });
    if (!category) return;

    const amount = await modal.prompt({
      title: 'Amount (₹)',
      inputType: 'number',
      confirmText: 'Next'
    });
    if (!amount || Number(amount) <= 0) return;

    const note = await modal.prompt({
      title: 'Note (Optional)',
      confirmText: 'Save'
    });

    const cat = String(category).toLowerCase().trim();
    const finalCat = CATEGORY_META[cat] ? cat : 'other';

    try {
      await firestoreService.create(this._path(), {
        category: finalCat,
        amount: Number(amount),
        note: note || '',
        timestamp: Date.now()
      });
      toast.success('Expense added!');
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

const page = new ExpensePage();
document.addEventListener('DOMContentLoaded', () => page.init());