// ============================================
// 🔍 Search Page
// ============================================

import customerService from '../services/customer-service.js';
import state from '../core/state.js';
import toast from '../ui/toast.js';
import { formatAmount } from '../utils/currency-utils.js';
import { getInitials, debounce } from '../utils/formatter.js';
import { navigate } from '../config/routes.js';
import { ROUTES } from '../config/constants.js';
import logger from '../utils/logger.js';

class SearchPage {
  constructor() {
    this.filterType = 'name';
    this.query = '';
    this.results = [];
  }

  init() {
    logger.info('🔍 Search init');

    this.input = document.getElementById('searchInput');
    this.resultsEl = document.getElementById('resultsContainer');
    this.emptyEl = document.getElementById('emptyState');
    this.loadingEl = document.getElementById('loadingState');
    this.infoEl = document.getElementById('searchInfo');

    this.setupListeners();
  }

  setupListeners() {
    this.input?.addEventListener('input', debounce((e) => {
      this.query = e.target.value.trim();
      if (this.query.length < 2) {
        this.showEmpty();
        return;
      }
      this.performSearch();
    }, 400));

    document.querySelectorAll('#filterTabs .pill-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#filterTabs .pill-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.filterType = tab.dataset.filter;

        const ph = {
          name: 'Customer ka naam likho...',
          mobile: '10 digit mobile number...',
          village: 'Village ka naam likho...'
        };
        if (this.input) {
          this.input.placeholder = ph[this.filterType] || 'Search...';
          this.input.type = this.filterType === 'mobile' ? 'tel' : 'text';
          this.input.maxLength = this.filterType === 'mobile' ? 10 : 100;
        }
        if (this.query.length >= 2) this.performSearch();
        else this.showEmpty();
      });
    });
  }

  async performSearch() {
    if (this.loadingEl) this.loadingEl.style.display = 'block';
    if (this.emptyEl) this.emptyEl.style.display = 'none';
    if (this.infoEl) this.infoEl.style.display = 'none';

    this.resultsEl?.querySelectorAll('.customer-card, .section-header').forEach((el) => el.remove());

    try {
      const results = await customerService.searchCustomers(
        this.query,
        this.filterType,
        { includeOtherSeasons: true }
      );
      this.results = results;
      this.renderResults();
    } catch (e) {
      logger.error('Search failed:', e);
      toast.error('Search fail');
    } finally {
      if (this.loadingEl) this.loadingEl.style.display = 'none';
    }
  }

  renderResults() {
    this.resultsEl?.querySelectorAll('.customer-card, .section-header').forEach((el) => el.remove());

    if (!this.results.length) {
      if (this.emptyEl) {
        this.emptyEl.style.display = 'block';
        const h3 = this.emptyEl.querySelector('h3');
        const p = this.emptyEl.querySelector('p');
        if (h3) h3.textContent = 'Koi result nahi mila';
        if (p) p.textContent = `"${this.query}" ke liye kuch nahi mila`;
      }
      return;
    }

    if (this.emptyEl) this.emptyEl.style.display = 'none';

    const current = this.results.filter((r) => r.isCurrent);
    const old = this.results.filter((r) => !r.isCurrent);

    if (this.infoEl) {
      this.infoEl.style.display = 'block';
      this.infoEl.textContent = `${this.results.length} results — ${current.length} current, ${old.length} old dues`;
    }

    if (current.length) {
      const h = document.createElement('div');
      h.className = 'section-header green';
      h.textContent = `📅 Current Season (${current.length})`;
      this.resultsEl.appendChild(h);
      current.forEach((c) => this.resultsEl.appendChild(this.buildCard(c, true)));
    }

    if (old.length) {
      const h = document.createElement('div');
      h.className = 'section-header orange';
      h.textContent = `⚠️ Previous Seasons (${old.length})`;
      this.resultsEl.appendChild(h);
      old.forEach((c) => this.resultsEl.appendChild(this.buildCard(c, false)));
    }
  }

  buildCard(c, isCurrent) {
    const div = document.createElement('div');
    div.className = 'customer-card';

    const due = Math.max(0, (c.due || 0));
    const isPaid = c.paymentClosed;

    div.innerHTML = `
      <div class="customer-avatar">${getInitials(c.name)}</div>
      <div class="customer-info">
        <div class="customer-name">${this._esc(c.name)}</div>
        <div class="customer-meta">
          ${this._esc(c.village || '')} • ${this._esc(c.mobile || '')}
          ${!isCurrent ? `<span style="color:#FFA726;margin-left:6px;">${this._esc(c.seasonLabel || '')}</span>` : ''}
        </div>
      </div>
      <div class="customer-right">
        <div class="customer-amount ${isPaid ? 'paid' : (due > 0 ? 'due' : '')}">
          ${isPaid ? 'PAID' : formatAmount(due)}
        </div>
        <span class="status-tag ${isPaid ? 'paid' : (due > 0 ? 'due' : 'paid')}">
          ${isPaid ? 'PAID' : (due > 0 ? 'DUE' : 'PAID')}
        </span>
      </div>
    `;

    div.addEventListener('click', () => {
      navigate(ROUTES.CUSTOMER_DETAIL, {
        id: c.id,
        season: c.seasonId || null
      });
    });

    return div;
  }

  showEmpty() {
    this.resultsEl?.querySelectorAll('.customer-card, .section-header').forEach((el) => el.remove());
    if (this.emptyEl) {
      this.emptyEl.style.display = 'block';
      const h3 = this.emptyEl.querySelector('h3');
      const p = this.emptyEl.querySelector('p');
      if (h3) h3.textContent = 'Kuch search karo';
      if (p) p.textContent = 'Customer ka naam, mobile ya village type karo';
    }
    if (this.loadingEl) this.loadingEl.style.display = 'none';
    if (this.infoEl) this.infoEl.style.display = 'none';
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new SearchPage();
document.addEventListener('DOMContentLoaded', () => page.init());