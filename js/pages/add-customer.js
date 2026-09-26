// ============================================
// ➕ Add Customer
// ============================================

import state from '../core/state.js';
import bus, { EVENTS } from '../core/events.js';
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import customerService from '../services/customer-service.js';
import whatsappService from '../services/whatsapp-service.js';
import { ROUTES } from '../config/constants.js';
import { formatAmount, calculateAmount } from '../utils/currency-utils.js';
import { formatDurationShort } from '../utils/formatter.js';
import { sanitizeMobile } from '../utils/validation.js';
import { getParam, navigate } from '../config/routes.js';
import logger from '../utils/logger.js';

class AddCustomerPage {
  constructor() {
    // Time from URL params (from timer page)
    this.time2W = 0;
    this.time4W = 0;
    this.rate2W = 600;
    this.rate4W = 900;
  }

  init() {
    logger.info('➕ Add customer init');

    // Read params
    this.time2W = Number(getParam('time2W', 0));
    this.time4W = Number(getParam('time4W', 0));
    this.rate2W = Number(getParam('rate2W', 600));
    this.rate4W = Number(getParam('rate4W', 900));

    // If no params, try to load from timer state
    if (this.time2W === 0 && this.time4W === 0) {
      const t = state.get('timerState') || {};
      this.time2W = t.time2W || 0;
      this.time4W = t.time4W || 0;
      this.rate2W = t.rate2W || 600;
      this.rate4W = t.rate4W || 900;
    }

    this.form = document.getElementById('customerForm');
    this.saveBtn = document.getElementById('saveBtn');
    this.errorEl = document.getElementById('formError');

    this.setupSeasonLabel();
    this.setupInputs();
    this.updateDisplay();
    this.setupListeners();
  }

  setupSeasonLabel() {
    const season = state.get('selectedSeason') || 'Kharif';
    const year = state.get('selectedYear') || String(new Date().getFullYear());
    const el = document.getElementById('seasonLabel');
    if (el) el.textContent = `${season} - ${year}`;
  }

  setupInputs() {
    // Pre-fill rates
    const rate2WEl = document.getElementById('rate2W');
    const rate4WEl = document.getElementById('rate4W');
    if (rate2WEl) rate2WEl.value = this.rate2W;
    if (rate4WEl) rate4WEl.value = this.rate4W;

    // Time inputs in minutes (if any)
    const time2WEl = document.getElementById('time2W');
    const time4WEl = document.getElementById('time4W');
    if (time2WEl) time2WEl.value = Math.round(this.time2W / 60);
    if (time4WEl) time4WEl.value = Math.round(this.time4W / 60);
  }

  setupListeners() {
    // Rate change → update display
    document.getElementById('rate2W')?.addEventListener('input', () => this.updateDisplay());
    document.getElementById('rate4W')?.addEventListener('input', () => this.updateDisplay());

    // Mobile: digits only
    const mobile = document.getElementById('mobile');
    mobile?.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
    });

    // Form submit
    this.form?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSave();
    });
  }

  updateDisplay() {
    const rate2W = Number(document.getElementById('rate2W')?.value) || 0;
    const rate4W = Number(document.getElementById('rate4W')?.value) || 0;

    const amount2W = calculateAmount(this.time2W, rate2W);
    const amount4W = calculateAmount(this.time4W, rate4W);
    const totalAmount = amount2W + amount4W;

    // Update displays if elements exist
    const disp2W = document.getElementById('display2W');
    const disp4W = document.getElementById('display4W');
    const amt2WEl = document.getElementById('amount2W');
    const amt4WEl = document.getElementById('amount4W');
    const totalEl = document.getElementById('totalAmount');
    const totalTimeEl = document.getElementById('totalTime');

    if (disp2W) disp2W.textContent = formatDurationShort(this.time2W);
    if (disp4W) disp4W.textContent = formatDurationShort(this.time4W);
    if (amt2WEl) amt2WEl.textContent = formatAmount(amount2W);
    if (amt4WEl) amt4WEl.textContent = formatAmount(amount4W);
    if (totalEl) totalEl.textContent = formatAmount(totalAmount);
    if (totalTimeEl) totalTimeEl.textContent = formatDurationShort(this.time2W + this.time4W);
  }

  async handleSave() {
    this.errorEl?.classList.remove('active');

    const name = document.getElementById('name').value.trim();
    const village = document.getElementById('village').value.trim();
    const mobile = sanitizeMobile(document.getElementById('mobile').value);
    const rate2W = Number(document.getElementById('rate2W').value) || 0;
    const rate4W = Number(document.getElementById('rate4W').value) || 0;
    const notes = document.getElementById('notes')?.value.trim() || '';

    // Validation
    if (!name || name.length < 2) return this.showError('Sahi customer naam daalo');
    if (!village || village.length < 2) return this.showError('Village daalo');
    if (mobile.length !== 10) return this.showError('Sahi 10 digit mobile number daalo');
    if (this.time2W === 0 && this.time4W === 0) {
      return this.showError('Timer me koi time nahi hai');
    }

    // Check duplicate
    const existing = await customerService.searchCustomers(mobile, 'mobile', { includeOtherSeasons: false });
    if (existing.length > 0) {
      const ok = await modal.confirm({
        title: 'Duplicate Warning',
        message: `${existing[0].name} ka same mobile already exist karta hai. Fir bhi add kare?`,
        confirmText: 'Yes, Add'
      });
      if (!ok) return;
    }

    this.saveBtn.disabled = true;
    this.saveBtn.textContent = '💾 Saving...';

    try {
      const result = await customerService.addCustomer({
        name, village, mobile,
        rate2W, rate4W,
        time2WSec: this.time2W,
        time4WSec: this.time4W,
        notes
      });

      if (!result.success) throw new Error(result.error);

      const customer = result.customer;
      bus.emit(EVENTS.CUSTOMER_ADDED, customer);

      // Reset timer
      state.set('timerState', {
        time2W: 0, time4W: 0,
        rate2W, rate4W,
        activeWheel: 2,
        running2W: false, running4W: false
      });
      state.saveTimerState();

      // WhatsApp message
      try {
        await whatsappService.sendWorkMessage({
          customer,
          time2W: this.time2W,
          time4W: this.time4W,
          amount2W: customer.amount2W,
          amount4W: customer.amount4W,
          totalAmount: customer.totalAmount
        });
      } catch (e) {
        logger.warn('WhatsApp failed:', e);
      }

      toast.success(`${name} saved!`);

      setTimeout(() => {
        navigate(ROUTES.CUSTOMER_DETAIL, {
          id: customer.id,
          season: customer.seasonId
        });
      }, 800);

    } catch (e) {
      logger.error('Save failed:', e);
      this.showError(e.message || 'Save fail ho gaya');
      this.saveBtn.disabled = false;
      this.saveBtn.textContent = '💾 Save Customer';
    }
  }

  showError(msg) {
    if (!this.errorEl) return;
    this.errorEl.textContent = msg;
    this.errorEl.classList.add('active');
    this.errorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

const page = new AddCustomerPage();
document.addEventListener('DOMContentLoaded', () => page.init());