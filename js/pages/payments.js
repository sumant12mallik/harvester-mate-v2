// ============================================
// 💳 Payments History Page
// ============================================

import state from '../core/state.js';
import toast from '../ui/toast.js';
import customerService from '../services/customer-service.js';
import { formatAmount } from '../utils/currency-utils.js';
import { getInitials } from '../utils/formatter.js';
import { formatDate } from '../utils/date-utils.js';
import { makeSeasonId } from '../utils/season-utils.js';
import logger from '../utils/logger.js';

class PaymentsPage {
  constructor() {
    this.allPayments = [];
    this.currentFilter = 'all';
  }

  async init() {
    logger.info('💳 Payments page init');

    this.listEl = document.getElementById('paymentsList');
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

  setupListeners() {
    document.querySelectorAll('#filterTabs .pill-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#filterTabs .pill-tab').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter;
        this.render();
      });
    });
  }

  async load() {
    try {
      const customers = await customerService.getCustomers();
      const all = [];

      for (const c of customers) {
        const payments = await customerService.getPayments(c.id);
        payments.forEach((p) => {
          all.push({ ...p, customerName: c.name, customerId: c.id });
        });
      }

      this.allPayments = all.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      this.updateStats();
      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Load fail');
    }
  }

  updateStats() {
    const received = this.allPayments.reduce((s, p) => s + (p.amount || 0), 0);
    const el = document.getElementById('totalReceived');
    if (el) el.textContent = formatAmount(received);
    const el2 = document.getElementById('totalDue');
    if (el2) el2.textContent = formatAmount(0);
  }

  render() {
    let list = [...this.allPayments];
    if (this.currentFilter !== 'all') {
      list = list.filter((p) => (p.mode || 'cash') === this.currentFilter);
    }

    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    const icons = { cash: '💵', upi: '📱', cheque: '🏦' };
    const colors = { cash: '#00FF88', upi: '#4A9EFF', cheque: '#FFA726' };

    this.listEl.innerHTML = list.map((p) => {
      const mode = p.mode || 'cash';
      const color = colors[mode] || '#00FF88';
      return `
        <div class="card" style="padding:14px;display:flex;gap:12px;align-items:center;">
          <div style="width:40px;height:40px;border-radius:12px;background:${color}22;color:${color};display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;">
            ${icons[mode] || '💰'}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:14px;font-weight:600;color:#fff;">${this._esc(p.customerName)}</div>
            <div style="font-size:11px;color:#7A8BA8;margin-top:2px;">
              ${formatDate(p.timestamp, 'medium')} • ${mode.toUpperCase()}
            </div>
          </div>
          <div style="font-size:15px;font-weight:700;color:#00FF88;font-family:monospace;">
            ${formatAmount(p.amount)}
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

const page = new PaymentsPage();
document.addEventListener('DOMContentLoaded', () => page.init());