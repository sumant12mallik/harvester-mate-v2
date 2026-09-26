// ============================================
// 🧾 Invoice Page
// ============================================

import toast from '../ui/toast.js';
import loader from '../ui/loader.js';
import customerService from '../services/customer-service.js';
import invoiceService from '../services/invoice-service.js';
import whatsappService from '../services/whatsapp-service.js';
import { getParam, navigate } from '../config/routes.js';
import { ROUTES } from '../config/constants.js';
import { formatAmount } from '../utils/currency-utils.js';
import logger from '../utils/logger.js';

class InvoicePage {
  constructor() {
    this.customer = null;
    this.payments = [];
    this.html = '';
  }

  async init() {
    logger.info('🧾 Invoice page init');

    this.customerId = getParam('id') || getParam('customer');
    this.seasonId = getParam('season');
    this.invoiceNumber = getParam('invoice');

    if (!this.customerId) {
      this.showError();
      return;
    }

    this.setupListeners();
    await this.load();
  }

  async load() {
    try {
      loader.show({ message: 'Loading invoice...' });

      this.customer = await customerService.getCustomer(this.customerId, this.seasonId);
      if (!this.customer) {
        this.showError();
        return;
      }

      this.payments = await customerService.getPayments(this.customerId, this.seasonId);

      this.html = invoiceService.generateInvoiceHTML({
        customer: this.customer,
        payments: this.payments,
        invoiceNumber: this.invoiceNumber
      });

      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Invoice load nahi hui');
      this.showError();
    } finally {
      loader.hide();
    }
  }

  render() {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('invoiceContainer').style.display = 'block';

    const preview = document.getElementById('invoicePreview');
    if (!preview) return;

    // Parse HTML and extract body content
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.html, 'text/html');
    preview.innerHTML = doc.body.innerHTML;
  }

  setupListeners() {
    document.getElementById('downloadBtn')?.addEventListener('click', () => this.download());
    document.getElementById('printBtn')?.addEventListener('click', () => this.print());
    document.getElementById('whatsappBtn')?.addEventListener('click', () => this.shareWhatsApp());
    document.getElementById('shareBtn')?.addEventListener('click', () => this.shareWhatsApp());
  }

  download() {
    try {
      const filename = `Invoice_${this.customer?.name || 'Customer'}_${Date.now()}.html`;
      invoiceService.downloadInvoice(this.html, filename);
      toast.success('Invoice downloaded!');
    } catch (e) {
      toast.error('Download fail');
    }
  }

  print() {
    try {
      const ok = invoiceService.printInvoice(this.html);
      if (ok) toast.info('Print dialog khul raha hai...');
      else toast.error('Popup block');
    } catch (e) {
      toast.error('Print fail');
    }
  }

  async shareWhatsApp() {
    if (!this.customer) return;
    const due = Math.max(0, (this.customer.totalAmount || 0) - (this.customer.totalPaid || 0));

    if (due > 0) {
      await whatsappService.sendWorkMessage({
        customer: this.customer,
        time2W: this.customer.time2WSec || 0,
        time4W: this.customer.time4WSec || 0,
        amount2W: this.customer.amount2W || 0,
        amount4W: this.customer.amount4W || 0,
        totalAmount: this.customer.totalAmount || 0
      });
    } else {
      await whatsappService.sendPaymentClosedMessage({ customer: this.customer });
    }
  }

  showError() {
    const l = document.getElementById('loadingState');
    const c = document.getElementById('invoiceContainer');
    const e = document.getElementById('errorState');
    if (l) l.style.display = 'none';
    if (c) c.style.display = 'none';
    if (e) e.style.display = 'block';
  }
}

const page = new InvoicePage();
document.addEventListener('DOMContentLoaded', () => page.init());