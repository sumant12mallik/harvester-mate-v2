// ============================================
// 📱 WhatsApp Service (Deep Links)
// ============================================

import { APP } from '../config/constants.js';
import { formatDurationShort } from '../utils/formatter.js';
import { formatAmount } from '../utils/currency-utils.js';
import { formatDate } from '../utils/date-utils.js';
import state from '../core/state.js';
import bus, { EVENTS } from '../core/events.js';
import logger from '../utils/logger.js';

class WhatsAppService {
  constructor() {
    this.messageHistory = this._loadHistory();
  }

  _loadHistory() {
    try {
      const h = localStorage.getItem('hm_wa_history');
      return h ? JSON.parse(h) : [];
    } catch (e) { return []; }
  }

  _saveHistory() {
    try {
      localStorage.setItem('hm_wa_history', JSON.stringify(this.messageHistory.slice(0, 50)));
    } catch (e) {}
  }

  _formatMobile(mobile) {
    if (!mobile) return null;
    const c = String(mobile).replace(/\D/g, '');
    if (c.length === 10) return `91${c}`;
    if (c.length === 12 && c.startsWith('91')) return c;
    return c;
  }

  _open(mobile, message) {
    const num = this._formatMobile(mobile);
    if (!num) {
      logger.warn('Invalid mobile');
      return false;
    }

    const encoded = encodeURIComponent(message);
    const url = `https://wa.me/${num}?text=${encoded}`;

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
      bus.emit(EVENTS.WHATSAPP_SENT, { mobile, message });

      this.messageHistory.unshift({
        mobile,
        message,
        timestamp: Date.now()
      });
      this._saveHistory();
      return true;
    } catch (e) {
      logger.error('WhatsApp open failed:', e);
      return false;
    }
  }

  // ===== WORK DONE MESSAGE =====
  async sendWorkMessage({ customer, time2W, time4W, amount2W, amount4W, totalAmount }) {
    const ownerName = state.get('userData')?.name || 'Harvester Owner';
    const today = formatDate(new Date(), 'medium');

    const message = `🌾 *${APP.NAME} - Work Update*

Namaste *${customer.name}* ji,

Aapka harvester kaam pura hua:

📅 *Date:* ${today}
🚜 *2 Wheel:* ${formatDurationShort(time2W)} → ${formatAmount(amount2W)}
🚜 *4 Wheel:* ${formatDurationShort(time4W)} → ${formatAmount(amount4W)}

━━━━━━━━━━━━━━━━
💰 *Total Amount:* ${formatAmount(totalAmount)}
━━━━━━━━━━━━━━━━

Dhanyawad! 🙏
*${ownerName}*
${APP.SUPPORT_PHONE}`;

    return { success: this._open(customer.mobile, message), message };
  }

  // ===== PAYMENT RECEIVED =====
  async sendPaymentReceivedMessage({ customer, paidAmount, newDue, mode = 'cash' }) {
    const ownerName = state.get('userData')?.name || 'Harvester Owner';
    const today = formatDate(new Date(), 'medium');
    const isFullyPaid = newDue <= 0;

    let dueLine = isFullyPaid
      ? `✅ *Aapka pura hisaab clear ho gaya!*`
      : `📌 *Baki Due:* ${formatAmount(newDue)}`;

    const message = `💰 *Payment Received*

Namaste *${customer.name}* ji,

Aapne *${formatAmount(paidAmount)}* ka payment kiya.
${dueLine}

━━━━━━━━━━━━━━━━
📅 Date: ${today}
💵 Mode: ${(mode || 'cash').toUpperCase()}
💳 Amount: ${formatAmount(paidAmount)}
📊 New Due: ${formatAmount(Math.max(0, newDue))}
━━━━━━━━━━━━━━━━

Dhanyawad! 🙏
*${ownerName}*`;

    return { success: this._open(customer.mobile, message), message };
  }

  // ===== PAYMENT CLOSED =====
  async sendPaymentClosedMessage({ customer }) {
    const ownerName = state.get('userData')?.name || 'Harvester Owner';

    const message = `✅ *Payment Complete*

Namaste *${customer.name}* ji,

Aapka pura hisaab clear ho gaya. Hamare saath jude rehne ke liye dhanyawad! 🙏

Phir milenge next season! 🌾

*${ownerName}*
${APP.SUPPORT_EMAIL}`;

    return { success: this._open(customer.mobile, message), message };
  }

  // ===== WELCOME =====
  async sendWelcomeMessage({ name, mobile, role = 'user' }) {
    const roleText = role === 'owner' ? 'Harvester Owner' : 'User';
    const message = `🌾 *Welcome to ${APP.NAME}!*

Namaste *${name}* ji,

Aapne successfully register kar liya hai as *${roleText}*.

${role === 'owner'
  ? '⏳ Aapka account admin approval ke liye bhej diya gaya hai.'
  : '✅ Aap ab login kar sakte hai.'}

Sampark: ${APP.SUPPORT_EMAIL}

*${APP.NAME} Team*`;

    return { success: this._open(mobile, message), message };
  }

  // ===== APPROVAL =====
  async sendApprovalMessage({ name, mobile }) {
    const message = `✅ *Account Approved!*

Namaste *${name}* ji,

Aapka Harvester Owner account approve ho gaya hai. Ab aap login kar sakte hai.

Happy harvesting! 🌾

*${APP.NAME} Team*`;

    return { success: this._open(mobile, message) };
  }

  async sendRejectionMessage({ name, mobile, reason = '' }) {
    const reasonText = reason ? `\n\n📝 *Reason:* ${reason}` : '';
    const message = `❌ *Account Not Approved*

Namaste *${name}* ji,

Khed hai, aapka registration approve nahi ho paya.${reasonText}

Sampark: ${APP.SUPPORT_PHONE}`;

    return { success: this._open(mobile, message) };
  }

  async sendDueReminder({ customer, dueAmount }) {
    const ownerName = state.get('userData')?.name || 'Harvester Owner';
    const message = `🔔 *Payment Reminder*

Namaste *${customer.name}* ji,

Aapka ${formatAmount(dueAmount)} ka payment pending hai.

Sampark: ${APP.SUPPORT_PHONE}

Dhanyawad! 🙏
*${ownerName}*`;

    return { success: this._open(customer.mobile, message) };
  }

  async sendCustom({ mobile, message }) {
    return { success: this._open(mobile, message) };
  }

  getHistory() {
    return [...this.messageHistory];
  }

  clearHistory() {
    this.messageHistory = [];
    this._saveHistory();
  }
}

const whatsappService = new WhatsAppService();
export default whatsappService;