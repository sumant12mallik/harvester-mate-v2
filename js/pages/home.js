// ============================================
// 🏠 Home Page (Timer + Circular Progress)
// ============================================

import state from '../core/state.js';
import bus, { EVENTS } from '../core/events.js';
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import customerService from '../services/customer-service.js';
import reportService from '../services/report-service.js';
import notificationService from '../services/notification-service.js';
import { ROUTES, TIMER as TIMER_CONFIG } from '../config/constants.js';
import { formatDuration, formatDurationShort, getInitials } from '../utils/formatter.js';
import { formatAmount, calculateAmount } from '../utils/currency-utils.js';
import { makeSeasonId } from '../utils/season-utils.js';
import { navigate } from '../config/routes.js';
import logger from '../utils/logger.js';

class HomePage {
  constructor() {
    // Timer state
    this.time2W = 0;
    this.time4W = 0;
    this.running2W = false;
    this.running4W = false;
    this.activeWheel = 2;
    this.interval = null;
    this.rate2W = 600;
    this.rate4W = 900;
    this.selectedCustomer = null;
  }

  async init() {
    logger.info('🏠 Home init');

    this.setupElements();
    this.loadTimerState();
    this.setupListeners();
    this.updateAllDisplays();
    this.updateNavbar();
    this.loadDashboardStats();

    // Auto-refresh stats every 30 sec
    setInterval(() => this.loadDashboardStats(), 30000);

    // Warn before unload
    window.addEventListener('beforeunload', (e) => {
      if (this.running2W || this.running4W) {
        e.preventDefault();
        e.returnValue = '';
      }
    });
  }

  setupElements() {
    this.timerDisplay = document.getElementById('timerDisplay');
    this.time2WDisplay = document.getElementById('time2WDisplay');
    this.time4WDisplay = document.getElementById('time4WDisplay');
    this.timerCircle = document.getElementById('timerCircle');
    this.timerIcon = document.getElementById('timerIcon');
    this.startBtn = document.getElementById('startBtn');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.stopBtn = document.getElementById('stopBtn');
    this.card2W = document.getElementById('card2W');
    this.card4W = document.getElementById('card4W');
    this.rate2WDisplay = document.getElementById('rate2WDisplay');
    this.rate4WDisplay = document.getElementById('rate4WDisplay');
    this.totalAmount = document.getElementById('totalAmount');
    this.saveBtn = document.getElementById('saveBtn');
    this.customerSelector = document.getElementById('customerSelector');
    this.customerSelectorText = document.getElementById('customerSelectorText');
    this.seasonLabel = document.getElementById('seasonLabel');
    this.notifBadge = document.getElementById('notifBadge');
  }

  loadTimerState() {
    const s = state.get('timerState') || {};
    this.time2W = s.time2W || 0;
    this.time4W = s.time4W || 0;
    this.rate2W = s.rate2W || TIMER_CONFIG.DEFAULT_RATE_2W;
    this.rate4W = s.rate4W || TIMER_CONFIG.DEFAULT_RATE_4W;
    this.activeWheel = s.activeWheel || 2;
  }

  setupListeners() {
    // Wheel select
    this.card2W?.addEventListener('click', () => this.selectWheel(2));
    this.card4W?.addEventListener('click', () => this.selectWheel(4));

    // Buttons
    this.startBtn?.addEventListener('click', () => this.startTimer());
    this.pauseBtn?.addEventListener('click', () => this.pauseTimer());
    this.stopBtn?.addEventListener('click', () => this.stopAndReset());

    // Save
    this.saveBtn?.addEventListener('click', () => this.handleSave());

    // Customer selector
    this.customerSelector?.addEventListener('click', () => this.openCustomerSelector());

    // Notification
    document.getElementById('notifBtn')?.addEventListener('click', () => {
      navigate(ROUTES.SETTINGS);
    });

    // Navbar title click → dashboard
    document.querySelector('.navbar-brand')?.addEventListener('click', () => {
      navigate(ROUTES.APP_HOME);
    });
  }

  updateNavbar() {
    const season = state.get('selectedSeason') || 'Kharif';
    const year = state.get('selectedYear') || String(new Date().getFullYear());
    if (this.seasonLabel) {
      this.seasonLabel.textContent = `${season} - ${year}`;
    }
    // Update section summary
    const seasonTag = document.querySelector('.summary-season-value');
    if (seasonTag) seasonTag.textContent = `${season} - ${year}`;
  }

  // ===== WHEEL SELECT =====
  selectWheel(wheel) {
    this.activeWheel = wheel;
    this.card2W?.classList.toggle('active', wheel === 2);
    this.card4W?.classList.toggle('active', wheel === 4);
    this.updateAllDisplays();
    this.saveState();
  }

  // ===== TIMER CONTROL =====
  startTimer() {
    if (this.activeWheel === 2) {
      if (this.running2W) return;
      this.running2W = true;
    } else {
      if (this.running4W) return;
      this.running4W = true;
    }

    if (!this.interval) this._startTick();

    this.updateAllDisplays();
    this.saveState();
    bus.emit(EVENTS.TIMER_STARTED, { wheel: this.activeWheel });
    toast.success(`${this.activeWheel}W timer started`);
  }

  pauseTimer() {
    if (!this.running2W && !this.running4W) {
      toast.info('Timer nahi chal raha');
      return;
    }
    this.running2W = false;
    this.running4W = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.updateAllDisplays();
    this.saveState();
    bus.emit(EVENTS.TIMER_STOPPED);
    toast.warning('Timer paused');
  }

  async stopAndReset() {
    if (this.time2W === 0 && this.time4W === 0) {
      toast.info('Timer khali hai');
      return;
    }

    const confirmed = await modal.confirm({
      title: 'Reset Timer',
      message: 'Saara timer reset karna hai? Ye undo nahi hoga.',
      confirmText: 'Reset',
      confirmVariant: 'danger'
    });
    if (!confirmed) return;

    this.time2W = 0;
    this.time4W = 0;
    this.running2W = false;
    this.running4W = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.selectedCustomer = null;
    if (this.customerSelectorText) {
      this.customerSelectorText.textContent = 'Select Customer';
      this.customerSelectorText.classList.remove('selected');
    }
    this.updateAllDisplays();
    this.saveState();
    toast.success('Timer reset!');
  }

  _startTick() {
    this.interval = setInterval(() => {
      if (this.running2W) this.time2W++;
      if (this.running4W) this.time4W++;
      this.updateAllDisplays();
      // Save every 5s
      if ((this.time2W + this.time4W) % 5 === 0) this.saveState();
    }, 1000);
  }

  // ===== DISPLAYS =====
  updateAllDisplays() {
    const activeTime = this.activeWheel === 2 ? this.time2W : this.time4W;
    const isRunning = this.activeWheel === 2 ? this.running2W : this.running4W;

    if (this.timerDisplay) this.timerDisplay.textContent = formatDuration(activeTime);
    if (this.time2WDisplay) this.time2WDisplay.textContent = formatDuration(this.time2W);
    if (this.time4WDisplay) this.time4WDisplay.textContent = formatDuration(this.time4W);

    if (this.timerIcon) {
      this.timerIcon.textContent = isRunning ? '⏸' : '⏱️';
    }

    // Circular progress: 1 hour = full circle
    if (this.timerCircle) {
      const maxSec = 3600; // 1 hour max
      const percent = Math.min(activeTime / maxSec, 1);
      const circumference = 2 * Math.PI * 100; // r=100
      const offset = circumference * (1 - percent);
      this.timerCircle.style.strokeDasharray = circumference;
      this.timerCircle.style.strokeDashoffset = offset;
    }

    // Rates
    if (this.rate2WDisplay) this.rate2WDisplay.textContent = `₹${this.rate2W}`;
    if (this.rate4WDisplay) this.rate4WDisplay.textContent = `₹${this.rate4W}`;

    // Total amount
    const amt2W = calculateAmount(this.time2W, this.rate2W);
    const amt4W = calculateAmount(this.time4W, this.rate4W);
    const total = amt2W + amt4W;
    if (this.totalAmount) this.totalAmount.textContent = formatAmount(total);
  }

  saveState() {
    const timerState = {
      time2W: this.time2W,
      time4W: this.time4W,
      rate2W: this.rate2W,
      rate4W: this.rate4W,
      activeWheel: this.activeWheel,
      running2W: this.running2W,
      running4W: this.running4W,
      savedAt: Date.now()
    };
    state.set('timerState', timerState);
    state.saveTimerState();
  }

  // ===== CUSTOMER SELECTOR =====
  async openCustomerSelector() {
    try {
      const customers = await customerService.getCustomers();
      if (!customers.length) {
        const addNew = await modal.confirm({
          title: 'Koi Customer Nahi',
          message: 'Abhi koi customer nahi hai. Naya add kare?',
          confirmText: 'Add New'
        });
        if (addNew) {
          this.handleSave();
        }
        return;
      }

      const html = `
        <input type="text" id="custSearch" class="input-field" placeholder="Search customer..." style="margin-bottom:12px;">
        <div id="custList" style="max-height:300px; overflow-y:auto;">
          ${customers.map((c) => `
            <div class="customer-card" data-cust-id="${c.id}" style="margin-bottom:8px;">
              <div class="customer-avatar">${getInitials(c.name)}</div>
              <div class="customer-info">
                <div class="customer-name">${this._esc(c.name)}</div>
                <div class="customer-meta">${this._esc(c.village || '')} • ${this._esc(c.mobile || '')}</div>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      modal.open({
        title: 'Select Customer',
        html,
        center: true,
        size: 'medium',
        buttons: [
          { label: 'Cancel', variant: 'ghost' }
        ]
      });

      // Attach handlers
      setTimeout(() => {
        document.querySelectorAll('[data-cust-id]').forEach((el) => {
          el.addEventListener('click', () => {
            const cust = customers.find((c) => c.id === el.dataset.custId);
            if (cust) {
              this.selectedCustomer = cust;
              if (this.customerSelectorText) {
                this.customerSelectorText.textContent = `${cust.name} • ${cust.village || ''}`;
                this.customerSelectorText.classList.add('selected');
              }
              modal.close();
              toast.success(`Customer: ${cust.name}`);
            }
          });
        });

        const search = document.getElementById('custSearch');
        search?.addEventListener('input', (e) => {
          const q = e.target.value.toLowerCase();
          document.querySelectorAll('[data-cust-id]').forEach((el) => {
            const text = el.textContent.toLowerCase();
            el.style.display = text.includes(q) ? '' : 'none';
          });
        });
      }, 200);

    } catch (e) {
      logger.error('Customer selector failed:', e);
    }
  }

  // ===== SAVE / HANDLE =====
  async handleSave() {
    if (this.time2W === 0 && this.time4W === 0) {
      toast.warning('Pehle timer start karo');
      return;
    }

    // If running, stop and confirm
    if (this.running2W || this.running4W) {
      const ok = await modal.confirm({
        title: 'Timer Chal Raha Hai',
        message: 'Timer rok ke customer assign kare?',
        confirmText: 'Haan'
      });
      if (!ok) return;
      this.pauseTimer();
    }

    // Navigate to add-customer with prefill
    const params = {
      time2W: this.time2W,
      time4W: this.time4W,
      rate2W: this.rate2W,
      rate4W: this.rate4W
    };
    if (this.selectedCustomer) {
      params.customerId = this.selectedCustomer.id;
    }

    logger.info('Navigating to add-customer:', params);
    navigate(ROUTES.ADD_CUSTOMER, params);
  }

  // ===== DASHBOARD STATS =====
  async loadDashboardStats() {
    try {
      const [today, report] = await Promise.all([
        reportService.getTodaySummary(),
        reportService.getSeasonReport()
      ]);

      if (report) {
        const statCustomers = document.getElementById('statCustomers');
        const statHours = document.getElementById('statHours');
        const statIncome = document.getElementById('statIncome');

        if (statCustomers) statCustomers.textContent = report.totalCustomers || 0;
        if (statHours) {
          const hours = (report.totalTime2W + report.totalTime4W) / 3600;
          statHours.textContent = hours.toFixed(1);
        }
        if (statIncome) {
          statIncome.textContent = formatAmount(report.totalWork || 0);
        }
      }

      // Notification badge
      const unread = await notificationService.getUnreadCount();
      if (this.notifBadge && unread > 0) {
        this.notifBadge.style.display = 'block';
      }
    } catch (e) {
      logger.warn('Dashboard stats failed:', e);
    }
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new HomePage();
document.addEventListener('DOMContentLoaded', () => page.init());

// Cleanup
window.addEventListener('unload', () => {
  if (page.interval) clearInterval(page.interval);
});