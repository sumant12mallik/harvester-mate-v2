// ============================================
// 🧠 Global State Manager
// ============================================

import { STORAGE_KEYS } from '../config/constants.js';

class AppState {
  constructor() {
    this.state = {
      user: null,
      userData: null,
      userRole: null,
      isAuthenticated: false,
      isApproved: false,
      
      selectedSeason: localStorage.getItem(STORAGE_KEYS.SELECTED_SEASON) || 'Kharif',
      selectedYear: localStorage.getItem(STORAGE_KEYS.SELECTED_YEAR) || String(new Date().getFullYear()),
      
      theme: localStorage.getItem(STORAGE_KEYS.THEME) || 'dark',
      isOnline: navigator.onLine,
      isLoading: false,
      
      timerState: this._loadTimerState()
    };
    this.listeners = new Map();
  }

  get(key) { return this.state[key]; }
  getAll() { return { ...this.state }; }

  set(key, value) {
    const old = this.state[key];
    if (old === value) return;
    this.state[key] = value;
    this._notify(key, value, old);
  }

  setMany(updates) {
    Object.entries(updates).forEach(([k, v]) => this.set(k, v));
  }

  subscribe(key, callback) {
    if (!this.listeners.has(key)) this.listeners.set(key, []);
    this.listeners.get(key).push(callback);
    return () => {
      const list = this.listeners.get(key) || [];
      const i = list.indexOf(callback);
      if (i > -1) list.splice(i, 1);
    };
  }

  _notify(key, nv, ov) {
    (this.listeners.get(key) || []).forEach((cb) => {
      try { cb(nv, ov); } catch (e) { console.error(e); }
    });
  }

  _loadTimerState() {
    try {
      const s = localStorage.getItem(STORAGE_KEYS.TIMER_STATE);
      return s ? JSON.parse(s) : {
        time2W: 0, time4W: 0,
        rate2W: 600, rate4W: 900,
        activeWheel: 2,
        running2W: false, running4W: false
      };
    } catch (e) {
      return { time2W: 0, time4W: 0, rate2W: 600, rate4W: 900, activeWheel: 2, running2W: false, running4W: false };
    }
  }

  saveTimerState() {
    try {
      localStorage.setItem(STORAGE_KEYS.TIMER_STATE, JSON.stringify(this.state.timerState));
    } catch (e) { console.warn('Timer save failed'); }
  }

  saveSeasonYear() {
    localStorage.setItem(STORAGE_KEYS.SELECTED_SEASON, this.state.selectedSeason);
    localStorage.setItem(STORAGE_KEYS.SELECTED_YEAR, this.state.selectedYear);
  }

  reset() {
    this.state.user = null;
    this.state.userData = null;
    this.state.userRole = null;
    this.state.isAuthenticated = false;
    this.state.isApproved = false;
  }
}

const state = new AppState();
export default state;