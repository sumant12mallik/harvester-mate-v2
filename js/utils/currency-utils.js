// ============================================
// 💰 Currency Utilities
// ============================================

export function formatAmount(amount, options = {}) {
  const { showSymbol = true, decimals = 0 } = options;
  const num = Number(amount) || 0;
  const formatted = num.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
  return showSymbol ? `₹${formatted}` : formatted;
}

export function compactNumber(num, decimals = 1) {
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  if (abs >= 10000000) return sign + (abs / 10000000).toFixed(decimals) + 'Cr';
  if (abs >= 100000) return sign + (abs / 100000).toFixed(decimals) + 'L';
  if (abs >= 1000) return sign + (abs / 1000).toFixed(decimals) + 'K';
  return sign + abs.toString();
}

export function calculateAmount(seconds, ratePerHour) {
  const hours = (seconds || 0) / 3600;
  return Math.round(hours * (Number(ratePerHour) || 0));
}

export function parseAmount(str) {
  if (typeof str === 'number') return str;
  return parseFloat(String(str || '').replace(/[₹,\s]/g, '')) || 0;
}

export function roundAmount(amount) {
  return Math.round(Number(amount) || 0);
}

export function amountInWords(amount) {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
                'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
                'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty',
                'Seventy', 'Eighty', 'Ninety'];
  
  function two(n) {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
  }
  
  function three(n) {
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let result = '';
    if (h) result += ones[h] + ' Hundred';
    if (rest) result += (h ? ' ' : '') + two(rest);
    return result;
  }
  
  let result = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = num % 1000;
  
  if (crore) result += three(crore) + ' Crore ';
  if (lakh) result += three(lakh) + ' Lakh ';
  if (thousand) result += three(thousand) + ' Thousand ';
  if (hundred) result += three(hundred);
  
  return result.trim() + ' Rupees Only';
}

export function percentage(value, total) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}