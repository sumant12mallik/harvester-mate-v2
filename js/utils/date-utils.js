// ============================================
// 📅 Date Utilities
// ============================================

export function now() {
  return new Date();
}

export function formatDate(date, format = 'medium') {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return '';

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthsFull = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const monthFull = monthsFull[d.getMonth()];
  const year = d.getFullYear();
  const hours24 = d.getHours();
  const hours12 = hours24 % 12 || 12;
  const hoursPadded = String(hours24).padStart(2, '0');
  const hours12Padded = String(hours12).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const ampm = hours24 >= 12 ? 'PM' : 'AM';
  const weekday = days[d.getDay()];

  switch (format) {
    case 'short': return `${day} ${month}`;
    case 'medium': return `${day} ${month} ${year}`;
    case 'long': return `${day} ${monthFull} ${year}`;
    case 'full': return `${weekday}, ${day} ${month} ${year}`;
    case 'time': return `${hours12Padded}:${minutes} ${ampm}`;
    case 'time24': return `${hoursPadded}:${minutes}`;
    case 'fullTime': return `${day} ${month} ${year}, ${hours12Padded}:${minutes} ${ampm}`;
    case 'iso': return d.toISOString();
    case 'input': return `${year}-${String(d.getMonth() + 1).padStart(2, '0')}-${day}`;
    default: return `${day} ${month} ${year}`;
  }
}

export function formatTime(date) {
  return formatDate(date, 'time');
}

export function timeAgo(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

export function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 6 && month <= 10) return 'Kharif';
  if (month >= 11 || month <= 3) return 'Rabi';
  return 'Zaid';
}

export function getCurrentSeasonYear() {
  const n = new Date();
  return `${getCurrentSeason()} ${n.getFullYear()}`;
}

export function getYearList(startYear = 2020, count = 10) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= startYear; y--) {
    years.push(String(y));
  }
  return years.slice(0, count);
}

export function daysBetween(date1, date2) {
  const d1 = startOfDay(date1);
  const d2 = startOfDay(date2);
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}