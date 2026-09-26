// ============================================
// 📅 Season Records Page
// ============================================

import state from '../core/state.js';
import toast from '../ui/toast.js';
import reportService from '../services/report-service.js';
import { formatAmount } from '../utils/currency-utils.js';
import { formatHoursShort } from '../utils/formatter.js';
import { makeSeasonId } from '../utils/season-utils.js';
import { formatDurationShort } from '../utils/formatter.js';
import logger from '../utils/logger.js';

class SeasonRecordsPage {
  constructor() {
    this.selectedYear = new Date().getFullYear();
    this.selectedSeason = 'Kharif';
  }

  async init() {
    logger.info('📅 Season records init');

    const yearEl = document.getElementById('yearSelect');
    const seasonEl = document.getElementById('seasonSelect');

    if (yearEl) {
      this.selectedYear = Number(yearEl.value);
      yearEl.addEventListener('change', () => {
        this.selectedYear = Number(yearEl.value);
        this.load();
      });
    }

    if (seasonEl) {
      this.selectedSeason = seasonEl.value;
      seasonEl.addEventListener('change', () => {
        this.selectedSeason = seasonEl.value;
        this.load();
      });
    }

    await this.load();
  }

  async load() {
    try {
      const seasonId = makeSeasonId(this.selectedSeason, String(this.selectedYear));
      const report = await reportService.getSeasonReport(seasonId);

      if (!report) {
        toast.warning('Is season me koi data nahi');
        this.resetStats();
        return;
      }

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

      set('recCustomers', report.totalCustomers || 0);
      set('recHours', ((report.totalTime2W + report.totalTime4W) / 3600).toFixed(1));
      set('recIncome', formatAmount(report.totalWork || 0));
      set('recExpense', formatAmount(report.totalExpenses || 0));
      set('recBalance', formatAmount(report.netProfit || 0));
      set('recDiesel', `${(report.totalLiters || 0).toFixed(1)} L`);

      // Highlight balance color
      const balanceEl = document.getElementById('recBalance');
      if (balanceEl) {
        balanceEl.style.color = report.netProfit >= 0 ? 'var(--purple)' : 'var(--danger)';
      }

      // Bar chart
      this.renderChart(report.monthlyData || []);

    } catch (e) {
      logger.error('Season load failed:', e);
      toast.error('Load fail');
    }
  }

  renderChart(monthlyData) {
    const chartEl = document.getElementById('seasonChart');
    if (!chartEl) return;

    if (!monthlyData.length) {
      chartEl.innerHTML = '<p style="text-align:center;color:#7A8BA8;padding:20px;font-size:13px;">Data nahi hai</p>';
      return;
    }

    const maxValue = Math.max(...monthlyData.flatMap((m) => [m.earnings, m.expenses]), 1);

    chartEl.innerHTML = monthlyData.map((m) => {
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

  resetStats() {
    ['recCustomers', 'recHours', 'recIncome', 'recExpense', 'recBalance', 'recDiesel'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.textContent = '—';
    });
  }
}

const page = new SeasonRecordsPage();
document.addEventListener('DOMContentLoaded', () => page.init());