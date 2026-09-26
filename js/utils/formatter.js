// ============================================
// 🔤 Formatters
// ============================================

export function formatDuration(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export function formatDurationShort(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatHours(seconds) {
  return `${((seconds || 0) / 3600).toFixed(2)} hrs`;
}

export function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getFirstLetter(name) {
  if (!name) return '?';
  return name.trim().charAt(0).toUpperCase();
}

export function formatMobile(mobile) {
  if (!mobile) return '';
  const c = String(mobile).replace(/\D/g, '');
  return c.length === 10 ? `${c.slice(0, 5)} ${c.slice(5)}` : c;
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function titleCase(str) {
  if (!str) return '';
  return str.split(' ').map(capitalize).join(' ');
}

export function truncate(str, len = 30, suffix = '...') {
  if (!str) return '';
  return str.length <= len ? str : str.slice(0, len) + suffix;
}

export function pluralize(count, singular, plural = null) {
  if (count === 1) return `${count} ${singular}`;
  return `${count} ${plural || singular + 's'}`;
}

export function formatWheel(wheel) {
  return wheel === 4 ? '4 Wheel' : '2 Wheel';
}

export function formatRole(role) {
  const labels = { admin: 'Admin', owner: 'Harvester Owner', user: 'User' };
  return labels[role] || role || '';
}

export function formatPaymentMode(mode) {
  const labels = { cash: 'Cash', online: 'Online', upi: 'UPI', cheque: 'Cheque' };
  return labels[mode] || mode || '';
}

export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit = 300) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

export function sortBy(arr, key, direction = 'asc') {
  return [...arr].sort((a, b) => {
    const av = a[key], bv = b[key];
    if (av < bv) return direction === 'asc' ? -1 : 1;
    if (av > bv) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}