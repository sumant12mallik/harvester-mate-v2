// ============================================
// ⏳ Loader
// ============================================

import bus, { EVENTS } from '../core/events.js';
import { createElement } from '../utils/dom-utils.js';

class Loader {
  constructor() {
    this.fullPageLoader = null;
    this.loaderCount = 0;
    this._setupListener();
  }

  _setupListener() {
    bus.on(EVENTS.LOADING_START, () => this.show());
    bus.on(EVENTS.LOADING_STOP, () => this.hide());
  }

  show(options = {}) {
    const { message = '' } = options;
    this.loaderCount++;

    if (this.fullPageLoader) {
      const msgEl = this.fullPageLoader.querySelector('.loader-message');
      if (msgEl) msgEl.textContent = message;
      return;
    }

    const loader = createElement('div', {
      className: 'page-loader',
      id: 'global-loader'
    });

    const spinner = createElement('div', { className: 'spinner spinner-lg' });
    loader.appendChild(spinner);

    if (message) {
      const msg = createElement('p', {
        className: 'loader-message',
        text: message
      });
      loader.appendChild(msg);
    }

    document.body.appendChild(loader);
    this.fullPageLoader = loader;
    document.body.style.overflow = 'hidden';
  }

  hide() {
    this.loaderCount = Math.max(0, this.loaderCount - 1);
    if (this.loaderCount > 0) return;
    if (!this.fullPageLoader) return;

    this.fullPageLoader.style.opacity = '0';
    setTimeout(() => {
      if (this.fullPageLoader?.parentElement) {
        this.fullPageLoader.parentElement.removeChild(this.fullPageLoader);
      }
      this.fullPageLoader = null;
      document.body.style.overflow = '';
    }, 300);
  }

  forceHide() {
    this.loaderCount = 0;
    if (this.fullPageLoader?.parentElement) {
      this.fullPageLoader.parentElement.removeChild(this.fullPageLoader);
      this.fullPageLoader = null;
    }
    document.body.style.overflow = '';
  }

  showIn(element, message = '') {
    if (typeof element === 'string') element = document.querySelector(element);
    if (!element) return;

    const existing = element.querySelector('.section-loader');
    if (existing) return;

    element.style.position = 'relative';
    const loader = createElement('div', { className: 'section-loader' });
    const spinner = createElement('div', { className: 'spinner' });
    loader.appendChild(spinner);

    if (message) {
      const msg = createElement('p', {
        className: 'loader-message',
        text: message
      });
      loader.appendChild(msg);
    }
    element.appendChild(loader);
  }

  hideIn(element) {
    if (typeof element === 'string') element = document.querySelector(element);
    if (!element) return;
    const loader = element.querySelector('.section-loader');
    if (loader) loader.remove();
  }

  buttonLoading(button, loading = true, text = 'Loading...') {
    if (typeof button === 'string') button = document.querySelector(button);
    if (!button) return;

    if (loading) {
      button.dataset.originalHtml = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<span class="spinner spinner-sm"></span> ${text}`;
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.originalHtml || 'Submit';
    }
  }
}

const loader = new Loader();
export default loader;