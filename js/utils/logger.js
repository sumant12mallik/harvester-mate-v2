// ============================================
// 📝 Logger
// ============================================

import { ENV } from '../config/api-keys.js';

const COLORS = {
  info: 'color: #4A9EFF; font-weight: bold;',
  success: 'color: #00FF88; font-weight: bold;',
  warn: 'color: #FFA726; font-weight: bold;',
  error: 'color: #FF4757; font-weight: bold;',
  debug: 'color: #7A8BA8; font-style: italic;'
};

class Logger {
  constructor() {
    this.enabled = ENV.IS_DEVELOPMENT || ENV.IS_STAGING;
    this.history = [];
    this.maxHistory = 100;
  }

  _log(level, emoji, ...args) {
    if (!this.enabled && level === 'debug') return;
    const t = new Date().toLocaleTimeString('en-IN', { hour12: false });
    const prefix = `${emoji} [${t}]`;
    this.history.push({ level, t, args });
    if (this.history.length > this.maxHistory) this.history.shift();
    if (console[level]) console[level](`%c${prefix}`, COLORS[level] || '', ...args);
    else console.log(prefix, ...args);
  }

  info(...a) { this._log('info', 'ℹ️', ...a); }
  success(...a) { this._log('success', '✅', ...a); }
  warn(...a) { this._log('warn', '⚠️', ...a); }
  error(...a) { this._log('error', '❌', ...a); }
  debug(...a) { this._log('debug', '🐛', ...a); }
}

const logger = new Logger();
export default logger;

export const log = {
  info: (...a) => logger.info(...a),
  success: (...a) => logger.success(...a),
  warn: (...a) => logger.warn(...a),
  error: (...a) => logger.error(...a),
  debug: (...a) => logger.debug(...a)
};