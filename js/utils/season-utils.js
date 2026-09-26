// ============================================
// 🌾 Season Utilities
// ============================================

import { SEASONS, STORAGE_KEYS, SEASON_MONTHS } from '../config/constants.js';

export function makeSeasonId(season, year) {
  if (!season && !year) return '';
  return `${season || ''}_${year || ''}`.replace(/\s+/g, '');
}

export function parseSeasonId(seasonId) {
  if (!seasonId) return { season: '', year: '' };
  const parts = String(seasonId).split('_');
  if (parts.length === 2) return { season: parts[0], year: parts[1] };
  return { season: seasonId, year: '' };
}

export function getSeasonLabel(season, year) {
  if (!season) return year ? String(year) : '';
  if (!year) return season;
  return `${season} ${year}`;
}

export function getSeasonMonths(season) {
  return SEASON_MONTHS[season] || '';
}

export function getCurrentSeason() {
  const m = new Date().getMonth() + 1;
  if (m >= 6 && m <= 10) return SEASONS.KHARIF;
  if (m >= 11 || m <= 3) return SEASONS.RABI;
  return SEASONS.ZAID;
}

export function getCurrentSeasonYear() {
  const n = new Date();
  return { season: getCurrentSeason(), year: String(n.getFullYear()) };
}

// ===== SEASON HISTORY (localStorage) =====
export function getSeasonHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SEASON_HISTORY);
    if (!data) return getDefaultSeasons();
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed) || !parsed.length) return getDefaultSeasons();
    return parsed;
  } catch (e) {
    return getDefaultSeasons();
  }
}

export function addSeasonToHistory(season, year, count = 0) {
  try {
    const history = getSeasonHistory();
    const s = String(season).trim();
    const y = String(year).trim();
    if (!s || !y) return;

    const idx = history.findIndex((h) => h.season === s && String(h.year) === y);
    if (idx > -1) {
      if (count > 0) history[idx].count = count;
      history[idx].lastUsed = Date.now();
    } else {
      history.unshift({ season: s, year: y, count, lastUsed: Date.now() });
    }

    localStorage.setItem(STORAGE_KEYS.SEASON_HISTORY, JSON.stringify(history.slice(0, 20)));
    return history.slice(0, 20);
  } catch (e) {
    return getSeasonHistory();
  }
}

export function removeSeasonFromHistory(season, year) {
  try {
    const history = getSeasonHistory();
    const filtered = history.filter(
      (h) => !(h.season === season && String(h.year) === String(year))
    );
    localStorage.setItem(STORAGE_KEYS.SEASON_HISTORY, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    return getSeasonHistory();
  }
}

export function clearSeasonHistory() {
  localStorage.removeItem(STORAGE_KEYS.SEASON_HISTORY);
  return getDefaultSeasons();
}

function getDefaultSeasons() {
  const currentYear = new Date().getFullYear();
  const current = getCurrentSeason();
  
  const defaults = [
    { season: current, year: String(currentYear), count: 0, lastUsed: Date.now() }
  ];
  
  const allSeasons = [SEASONS.KHARIF, SEASONS.RABI, SEASONS.ZAID];
  for (let i = 0; i < 4; i++) {
    const year = String(currentYear - Math.floor(i / 3));
    const s = allSeasons[i % 3];
    if (!(s === current && year === String(currentYear))) {
      defaults.push({ season: s, year, count: 0, lastUsed: Date.now() - i * 1000 });
    }
  }
  
  return defaults;
}