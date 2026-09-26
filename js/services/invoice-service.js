// ============================================
// 🧾 Invoice Service (HTML-based)
// ============================================

import { APP } from '../config/constants.js';
import { formatAmount, amountInWords } from '../utils/currency-utils.js';
import { formatDate, formatTime } from '../utils/date-utils.js';
import { formatDurationShort } from '../utils/formatter.js';
import state from '../core/state.js';
import logger from '../utils/logger.js';

class InvoiceService {
  generateInvoiceHTML({ customer, payments = [], invoiceNumber = null }) {
    const ownerData = state.get('userData') || {};
    const ownerName = ownerData.name || 'Harvester Owner';
    const ownerMobile = ownerData.mobile || '';
    const ownerVillage = ownerData.village || '';

    const invNum = invoiceNumber || this._generateInvoiceNumber();
    const invDate = formatDate(new Date(), 'long');
    const invTime = formatTime(new Date());
    const due = Math.max(0, (customer.totalAmount || 0) - (customer.totalPaid || 0));

    const paymentRows = (payments || []).map((p) => `
      <tr>
        <td>${formatDate(p.timestamp, 'short')}</td>
        <td>${(p.mode || 'cash').toUpperCase()}</td>
        <td>${p.note || '-'}</td>
        <td style="text-align:right;color:#00C853;font-weight:700;">${formatAmount(p.amount)}</td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;color:#8896a4;">Koi payment nahi hua</td></tr>';

    return `
<!DOCTYPE html>
<html lang="hi">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invNum} - ${APP.NAME}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Poppins','Segoe UI',sans-serif; background:#f5f7fa; color:#1a2027; padding:20px; line-height:1.5; }
    .invoice { max-width:800px; margin:0 auto; background:#fff; border-radius:16px; padding:40px; box-shadow:0 4px 24px rgba(0,0,0,0.08); }
    .header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:24px; border-bottom:2px solid #00C853; margin-bottom:24px; }
    .brand { display:flex; align-items:center; gap:12px; }
    .brand-icon { width:48px; height:48px; background:linear-gradient(135deg,#00FF88,#00CC6A); border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:24px; }
    .brand-name { font-size:22px; font-weight:800; color:#00CC6A; }
    .brand-tagline { font-size:11px; color:#8896a4; text-transform:uppercase; letter-spacing:0.1em; }
    .invoice-number { font-size:20px; font-weight:800; margin-bottom:4px; text-align:right; }
    .invoice-date { font-size:12px; color:#8896a4; text-align:right; }
    .parties { display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-bottom:32px; }
    .party-title { font-size:11px; font-weight:700; color:#8896a4; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:8px; }
    .party-name { font-size:16px; font-weight:700; margin-bottom:4px; }
    .party-detail { font-size:13px; color:#5a6b7c; }
    .section-title { font-size:14px; font-weight:700; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid #e5e9ef; }
    table { width:100%; border-collapse:collapse; margin-bottom:24px; }
    th { text-align:left; font-size:11px; font-weight:700; color:#8896a4; text-transform:uppercase; padding:10px 12px; background:#f8fafc; border-bottom:1px solid #e5e9ef; }
    td { padding:12px; font-size:13px; border-bottom:1px solid #f0f2f5; }
    .summary { background:#f8fafc; border-radius:12px; padding:20px; margin-top:24px; }
    .summary-row { display:flex; justify-content:space-between; padding:8px 0; font-size:14px; }
    .summary-row.total { border-top:2px solid #e5e9ef; margin-top:8px; padding-top:16px; font-size:18px; font-weight:800; }
    .amount-words { font-size:12px; color:#5a6b7c; margin-top:8px; font-style:italic; }
    .footer { margin-top:40px; padding-top:20px; border-top:1px solid #e5e9ef; text-align:center; font-size:11px; color:#8896a4; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div class="brand">
        <div class="brand-icon">🌾</div>
        <div>
          <div class="brand-name">${APP.NAME}</div>
          <div class="brand-tagline">Harvester Work Invoice</div>
        </div>
      </div>
      <div>
        <div class="invoice-number">#${invNum}</div>
        <div class="invoice-date">${invDate} • ${invTime}</div>
      </div>
    </div>

    <div class="parties">
      <div>
        <div class="party-title">From (Owner)</div>
        <div class="party-name">${this._esc(ownerName)}</div>
        <div class="party-detail">${this._esc(ownerVillage)}</div>
        <div class="party-detail">📞 ${ownerMobile ? '+91 ' + ownerMobile : '-'}</div>
      </div>
      <div>
        <div class="party-title">To (Customer)</div>
        <div class="party-name">${this._esc(customer.name)}</div>
        <div class="party-detail">${this._esc(customer.village)}</div>
        <div class="party-detail">📞 +91 ${this._esc(customer.mobile)}</div>
      </div>
    </div>

    <div class="section-title">🚜 Work Details</div>
    <table>
      <thead>
        <tr>
          <th>Type</th><th>Time</th><th>Rate/hr</th><th style="text-align:right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${customer.time2WSec > 0 ? `
        <tr>
          <td>2 Wheel</td>
          <td>${formatDurationShort(customer.time2WSec)}</td>
          <td>${formatAmount(customer.rate2W)}</td>
          <td style="text-align:right;color:#00C853;font-weight:700;">${formatAmount(customer.amount2W)}</td>
        </tr>` : ''}
        ${customer.time4WSec > 0 ? `
        <tr>
          <td>4 Wheel</td>
          <td>${formatDurationShort(customer.time4WSec)}</td>
          <td>${formatAmount(customer.rate4W)}</td>
          <td style="text-align:right;color:#00C853;font-weight:700;">${formatAmount(customer.amount4W)}</td>
        </tr>` : ''}
      </tbody>
    </table>

    <div class="section-title">💰 Payment History</div>
    <table>
      <thead>
        <tr><th>Date</th><th>Mode</th><th>Note</th><th style="text-align:right;">Amount</th></tr>
      </thead>
      <tbody>${paymentRows}</tbody>
    </table>

    <div class="summary">
      <div class="summary-row">
        <span>Subtotal (Work)</span>
        <span style="color:#00C853;font-weight:700;">${formatAmount(customer.totalAmount)}</span>
      </div>
      <div class="summary-row">
        <span>Total Paid</span>
        <span style="color:#00C853;font-weight:700;">${formatAmount(customer.totalPaid)}</span>
      </div>
      ${due > 0 ? `
      <div class="summary-row total">
        <span>Balance Due</span>
        <span style="color:#EF5350;">${formatAmount(due)}</span>
      </div>` : `
      <div class="summary-row total">
        <span>Status</span>
        <span style="color:#00C853;">✅ PAID IN FULL</span>
      </div>`}
      <div class="amount-words">Amount: ${amountInWords(customer.totalAmount)}</div>
    </div>

    <div class="footer">
      <p><strong>${APP.NAME}</strong> — For a Better Harvest Tomorrow</p>
      <p>Support: ${APP.SUPPORT_EMAIL} | ${APP.SUPPORT_PHONE}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  printInvoice(html) {
    const w = window.open('', '_blank');
    if (!w) return false;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 500);
    return true;
  }

  downloadInvoice(html, filename = null) {
    const name = filename || `Invoice_${Date.now()}.html`;
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logger.success('Invoice downloaded:', name);
  }

  _generateInvoiceNumber() {
    const n = new Date();
    const year = n.getFullYear();
    const month = String(n.getMonth() + 1).padStart(2, '0');
    const rand = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    return `INV-${year}${month}-${rand}`;
  }

  _esc(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }
}

const invoiceService = new InvoiceService();
export default invoiceService;