// ============================================
// 📊 Reports Page
// ============================================

import state from '../core/state.js';
import toast from '../ui/toast.js';
import reportService from '../services/report-service.js';
import { formatAmount } from '../utils/currency-utils.js';
import { downloadFile } from '../utils/helpers.js';
import logger from '../utils/logger.js';

class ReportsPage {
  constructor() {
    this.currentPeriod = 'monthly';
    this.currentDate = new Date();
  }

  async init() {
    logger.info('📊 Reports page init');

    this.setupListeners();
    this.updateMonthLabel();
    await this.load();
  }

  setupListeners() {
    document.querySelectorAll('#periodTabs .tab-segment').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('#periodTabs .tab-segment').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentPeriod = tab.dataset.period;
        this.load();
      });
    });

    document.getElementById('prevMonth')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
      this.updateMonthLabel();
      this.load();
    });

    document.getElementById('nextMonth')?.addEventListener('click', () => {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
      this.updateMonthLabel();
      this.load();
    });

    document.getElementById('exportBtn')?.addEventListener('click', () => this.exportCSV());
  }

  updateMonthLabel() {
    const el = document.getElementById('monthLabel');
    if (el) {
      el.textContent = this.currentDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    }
  }

  async load() {
    try {
      const report = await reportService.getSeasonReport();
      if (!report) return;

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('reportIncome', formatAmount(report.totalWork || 0));
      set('reportExpense', formatAmount(report.totalExpenses || 0));
      set('reportProfit', formatAmount(report.netProfit || 0));
      set('reportHours', ((report.totalTime2W + report.totalTime4W) / 3600).toFixed(1));
      set('reportDiesel', `${(report.totalLiters || 0).toFixed(0)} L`);
      set('reportCustomers', report.totalCustomers || 0);

      // Bar chart
      this.renderMonthlyChart(report.monthlyData || []);

      // Breakdown
      this.renderBreakdown(report.expenseBreakdown || []);

    } catch (e) {
      logger.error('Report load failed:', e);
      toast.error('Report load fail');
    }
  }

  renderMonthlyChart(monthlyData) {
    const el = document.getElementById('monthlyChart');
    if (!el) return;

    if (!monthlyData.length) {
      el.innerHTML = '<p style="text-align:center;color:#7A8BA8;padding:20px;font-size:13px;">Data nahi hai</p>';
      return;
    }

    const maxValue = Math.max(...monthlyData.flatMap((m) => [m.earnings, m.expenses]), 1);

    el.innerHTML = monthlyData.map((m) => {
      const earnH = Math.max((m.earnings / maxValue) * 100, 5);
      const expH = Math.max((m.expenses / maxValue) * 100, 5);
      return `
        <div class="bar-item">
          <div class="bar-stack">
            <div class="bar-fill green" style="height:${earnH}%"></div>
            <div class="bar-fill orange" style="height:${expH}%"></div>
          </div>
          <span class="bar-label">${m.month}</span>
        </div>
      `;
    }).join('');
  }

  renderBreakdown(breakdown) {
    const el = document.getElementById('breakdownList');
    if (!el) return;

    if (!breakdown.length) {
      el.innerHTML = '<p style="text-align:center;color:#7A8BA8;padding:20px;font-size:13px;">Koi expense nahi</p>';
      return;
    }

    const total = breakdown.reduce((s, b) => s + b.amount, 0);

    el.innerHTML = breakdown.map((b) => {
      const percent = total > 0 ? ((b.amount / total) * 100).toFixed(0) : 0;
      return `
        <div class="breakdown-item">
          <div class="breakdown-left">
            <div class="breakdown-icon">${b.icon || '💰'}</div>
            <div>
              <div class="breakdown-label">${b.label}</div>
              <div style="font-size:10px;color:#7A8BA8;">${percent}%</div>
            </div>
          </div>
          <div class="breakdown-amount">${formatAmount(b.amount)}</div>
        </div>
      `;
    }).join('');
  }

  async exportCSV() {
    try {
      toast.info('CSV generate...');
      const csv = await reportService.exportCustomersCSV();
      const filename = `HarvesterMate_Customers_${Date.now()}.csv`;
      downloadFile(csv, filename, 'text/csv');
      toast.success('CSV downloaded!');
    } catch (e) {
      logger.error('CSV export failed:', e);
      toast.error('Export fail');
    }
  }
}

const page = new ReportsPage();
document.addEventListener('DOMContentLoaded', () => page.init());