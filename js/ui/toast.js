// ============================================
// 🍞 Toast Notifications
// ============================================

import bus, { EVENTS } from '../core/events.js';
import { UI } from '../config/constants.js';
import { createElement } from '../utils/dom-utils.js';

class Toast {
  constructor() {
    this.container = null;
    this.activeToasts = new Map();
    this._createContainer();
    this._setupListener();
  }

  _createContainer() {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = createElement('div', {
        id: 'toast-container',
        className: 'toast-container'
      });
      document.body.appendChild(container);
    }
    this.container = container;
  }

  _setupListener() {
    bus.on(EVENTS.TOAST, (data) => {
      if (typeof data === 'string') {
        this.show({ message: data, type: 'info' });
      } else {
        this.show(data);
      }
    });
  }

  show(options = {}) {
    const {
      message = '',
      type = 'info',
      duration = UI.TOAST_DURATION,
      id = null
    } = options;

    if (!message) return;

    const toastId = id || `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    if (this.activeToasts.has(toastId)) return;

    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };

    const toast = createElement('div', {
      className: `toast ${type}`,
      attrs: { role: 'alert', 'data-id': toastId }
    });

    const iconEl = createElement('span', {
      className: 'toast-icon',
      text: icons[type] || icons.info
    });
    toast.appendChild(iconEl);

    const msgEl = createElement('span', {
      className: 'toast-message',
      text: message
    });
    toast.appendChild(msgEl);

    const closeBtn = createElement('button', {
      className: 'toast-close',
      text: '✕'
    });
    closeBtn.addEventListener('click', () => this.dismiss(toastId));
    toast.appendChild(closeBtn);

    this.container.appendChild(toast);
    this.activeToasts.set(toastId, toast);

    if (duration > 0) {
      setTimeout(() => this.dismiss(toastId), duration);
    }

    return toastId;
  }

  dismiss(toastId) {
    const toast = this.activeToasts.get(toastId);
    if (!toast) return;

    toast.classList.add('hiding');

    setTimeout(() => {
      if (toast.parentElement) toast.parentElement.removeChild(toast);
      this.activeToasts.delete(toastId);
    }, 300);
  }

  dismissAll() {
    this.activeToasts.forEach((_, id) => this.dismiss(id));
  }

  success(message) { return this.show({ message, type: 'success' }); }
  error(message) { return this.show({ message, type: 'error', duration: 5000 }); }
  warning(message) { return this.show({ message, type: 'warning' }); }
  info(message) { return this.show({ message, type: 'info' }); }
}

const toast = new Toast();
export default toast;