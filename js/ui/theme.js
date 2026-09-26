// ============================================
// 🎨 Theme Manager
// ============================================

import state from '../core/state.js';
import bus from '../core/events.js';
import { STORAGE_KEYS } from '../config/constants.js';

class Theme {
  constructor() {
    this.currentTheme = 'dark';
  }

  init() {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    this.apply(saved);
  }

  apply(theme) {
    const valid = ['dark', 'light'].includes(theme) ? theme : 'dark';
    this.currentTheme = valid;
    document.documentElement.setAttribute('data-theme', valid);
    localStorage.setItem(STORAGE_KEYS.THEME, valid);
    state.set('theme', valid);
    bus.emit('theme:changed', { theme: valid });
    this.updateMetaColor();
  }

  toggle() {
    const next = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.apply(next);
    return next;
  }

  get() { return this.currentTheme; }
  isDark() { return this.currentTheme === 'dark'; }
  isLight() { return this.currentTheme === 'light'; }

  updateMetaColor() {
    const color = this.isDark() ? '#0A0F1C' : '#F5F7FA';
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'theme-color');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', color);
  }
}

const theme = new Theme();
export default theme;