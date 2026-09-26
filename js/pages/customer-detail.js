// ============================================
// 👤 Customer Detail
// ============================================

import state from '../core/state.js';
import bus, { EVENTS } from '../core/events.js';
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import customerService from '../services/customer-service.js';
import whatsappService from '../services/whatsapp-service.js';
import { ROUTES, PAYMENT_MODES } from '../config/constants.js';
import { formatAmount } from '../utils/currency-utils.js';
import { formatDurationShort, getInitials } from '../utils/formatter.js';
import { formatDate } from '../utils/date-utils.js';
import { getParam, navigate } from '../config/routes.js';
import logger from '../utils/logger.js';

class CustomerDetailPage {
  constructor() {
    this.customerId = null;
    this.seasonId = null;
    this.customer = null;
    this.payments = [];
  }

  async init() {
    logger.info('👤 Customer detail init');

    this.customerId = getParam('id');
    this.seasonId = getParam('season');

    if (!this.customerId) {
      toast.error('Customer ID missing');
      setTimeout(() => navigate(ROUTES.CUSTOMERS), 1200);
      return;
    }

    this.setupListeners();
    await this.load();
  }

  setupListeners() {
    document.getElementById('editBtn')?.addEventListener('click', () => this.handleEdit());
    document.getElementById('deleteBtn')?.addEventListener('click', () => this.handleDelete());
    document.getElementById('whatsappBtn')?.addEventListener('click', () => this.handleWhatsApp());
    document.getElementById('paymentBtn')?.addEventListener('click', () => this.handlePayment());
  }

  async load() {
    try {
      this.customer = await customerService.getCustomer(this.customerId, this.seasonId);
      if (!this.customer) {
        toast.error('Customer nahi mila');
        setTimeout(() => navigate(ROUTES.CUSTOMERS), 1200);
        return;
      }
      this.payments = await customerService.getPayments(this.customerId, this.seasonId);

      this.renderHeader();
      this.renderStats();
      this.renderSummary();
      this.renderPaymentHistory();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Load fail ho gaya');
    }
  }

  renderHeader() {
    const c = this.customer;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('avatar', getInitials(c.name));
    set('custName', c.name || '—');
    set('custVillage', `📍 ${c.village || '—'}`);
    set('custMobile', `📞 +91 ${c.mobile || '—'}`);
    const navTitle = document.getElementById('navTitle');
    if (navTitle) navTitle.textContent = c.name || 'Customer';
    document.title = `${c.name} - HarvesterMate`;
  }

  renderStats() {
    const c = this.customer;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('stat2W', formatDurationShort(c.time2WSec || 0));
    set('stat4W', formatDurationShort(c.time4WSec || 0));
    set('statRates', `2W ₹${c.rate2W || 0} | 4W ₹${c.rate4W || 0}`);
  }

  renderSummary() {
    const c = this.customer;
    const totalTime = (c.time2WSec || 0) + (c.time4WSec || 0);
    const due = Math.max(0, (c.totalAmount || 0) - (c.totalPaid || 0));

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('sumTotalTime', formatDurationShort(totalTime));
    set('sumTotalAmount', formatAmount(c.totalAmount || 0));
    set('sumPaid', formatAmount(c.totalPaid || 0));

    const dueEl = document.getElementById('sumDue');
    if (dueEl) {
      dueEl.textContent = formatAmount(due);
      dueEl.style.color = due > 0 ? 'var(--danger)' : 'var(--green-primary)';
    }
  }

  renderPaymentHistory() {
    const container = document.getElementById('paymentHistory');
    if (!container) return;

    if (!this.payments.length) {
      container.innerHTML = `
        <div class="card" style="text-align:center;padding:30px;">
          <div style="font-size:36px;opacity:0.3;">💰</div>
          <p style="color:#7A8BA8;font-size:13px;margin-top:12px;">Abhi tak koi payment nahi hui</p>
        </div>`;
      return;
    }

    container.innerHTML = this.payments.map((p) => `
      <div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:14px;">
        <div style="flex:1;">
          <div style="font-weight:600;color:#fff;font-size:14px;">
            ${formatAmount(p.amount)}
          </div>
          <div style="font-size:11px;color:#7A8BA8;margin-top:4px;">
            ${formatDate(p.timestamp, 'medium')} • ${(p.mode || 'cash').toUpperCase()}
          </div>
          ${p.note ? `<div style="font-size:11px;color:#B0BEC5;margin-top:2px;">${this._esc(p.note)}</div>` : ''}
        </div>
        <span style="font-size:20px;">💰</span>
      </div>
    `).join('');
  }

  async handleEdit() {
    const c = this.customer;
    const r2 = await modal.prompt({
      title: '2 Wheel Rate',
      defaultValue: c.rate2W || 600,
      inputType: 'number'
    });
    if (r2 === null) return;

    const r4 = await modal.prompt({
      title: '4 Wheel Rate',
      defaultValue: c.rate4W || 900,
      inputType: 'number'
    });
    if (r4 === null) return;

    const result = await customerService.updateCustomer(this.customerId, {
      rate2W: Number(r2) || 0,
      rate4W: Number(r4) || 0
    }, this.seasonId);

    if (result.success) {
      toast.success('Rates updated!');
      await this.load();
    } else {
      toast.error('Update fail');
    }
  }

  async handleDelete() {
    const ok = await modal.confirm({
      title: 'Delete Customer',
      message: `${this.customer.name} ko delete karna hai?`,
      confirmText: 'Delete',
      confirmVariant: 'danger'
    });
    if (!ok) return;

    const result = await customerService.deleteCustomer(this.customerId, this.seasonId);
    if (result.success) {
      toast.success('Deleted');
      setTimeout(() => navigate(ROUTES.CUSTOMERS), 800);
    }
  }

  async handleWhatsApp() {
    const c = this.customer;
    const due = Math.max(0, (c.totalAmount || 0) - (c.totalPaid || 0));

    if (due > 0) {
      await whatsappService.sendWorkMessage({
        customer: c,
        time2W: c.time2WSec || 0,
        time4W: c.time4WSec || 0,
        amount2W: c.amount2W || 0,
        amount4W: c.amount4W || 0,
        totalAmount: c.totalAmount || 0
      });
    } else {
      await whatsappService.sendPaymentClosedMessage({ customer: c });
    }
  }

  async handlePayment() {
    const due = Math.max(0, (this.customer.totalAmount || 0) - (this.customer.totalPaid || 0));
    if (due <= 0) {
      toast.info('Koi due nahi hai');
      return;
    }

    // Quick payment modal
    const amount = await modal.prompt({
      title: 'Payment Amount',
      message: `Due: ${formatAmount(due)}`,
      defaultValue: Math.round(due),
      inputType: 'number',
      confirmText: 'Next'
    });
    if (!amount || Number(amount) <= 0) return;

    const mode = await modal.prompt({
      title: 'Payment Mode',
      message: 'cash / upi / cheque me se likho',
      defaultValue: 'cash',
      confirmText: 'Save'
    });
    if (!mode) return;

    const result = await customerService.recordPayment(
      this.customerId,
      Number(amount),
      mode.toLowerCase(),
      '',
      this.seasonId
    );

    if (!result.success) {
      toast.error(result.error || 'Payment fail');
      return;
    }

    bus.emit(EVENTS.PAYMENT_ADDED, { amount, mode });

    // WhatsApp notification
    try {
      await whatsappService.sendPaymentReceivedMessage({
        customer: this.customer,
        paidAmount: Number(amount),
        newDue: result.newDue,
        mode: mode.toLowerCase()
      });
    } catch (e) {}

    toast.success(`Payment ${formatAmount(amount)} recorded!`);

    if (result.fullyPaid) {
      setTimeout(async () => {
        const close = await modal.confirm({
          title: '🎉 Fully Paid!',
          message: 'Poora hisaab clear! Payment close karke thank you bheje?',
          confirmText: 'Yes'
        });
        if (close) {
          await customerService.closePayment(this.customerId, this.seasonId);
          await whatsappService.sendPaymentClosedMessage({ customer: this.customer });
          toast.success('Closed & thank you sent!');
        }
        await this.load();
      }, 800);
    } else {
      await this.load();
    }
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new CustomerDetailPage();
document.addEventListener('DOMContentLoaded', () => page.init());