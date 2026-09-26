// ============================================
// 🧭 Router
// ============================================

import bus from './events.js';
import state from './state.js';
import { getCurrentPage, getQueryParams } from '../config/routes.js';
import { ROUTES } from '../config/constants.js';

class Router {
  constructor() {
    this.currentPage = getCurrentPage();
    this.currentParams = getQueryParams();
    this.isNavigating = false;
  }

  init() {
    window.addEventListener('popstate', (e) => this._handlePopState(e));

    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-link]');
      if (link && link.href && !link.target) {
        e.preventDefault();
        this.navigateTo(link.getAttribute('href'));
      }
    });

    document.addEventListener('visibilitychange', () => {
      bus.emit(document.hidden ? 'page:hidden' : 'page:visible');
    });

    window.addEventListener('beforeunload', (e) => {
      const t = state.get('timerState');
      if (t?.running2W || t?.running4W) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    });

    console.log('🧭 Router ready:', this.currentPage);
    bus.emit('router:ready', { page: this.currentPage });
  }

  navigateTo(url) {
    if (this.isNavigating) return;
    this.isNavigating = true;
    window.location.href = url;
  }

  goBack() {
    if (window.history.length > 1) window.history.back();
    else this.navigateTo(ROUTES.APP_HOME);
  }

  _handlePopState(e) {
    bus.emit('router:popstate', { page: getCurrentPage(), state: e.state });
  }

  refresh() { window.location.reload(); }

  getCurrent() {
    return { page: this.currentPage, params: this.currentParams, path: window.location.pathname };
  }

  isOn(page) { return this.currentPage === page; }
}

const router = new Router();
export default router;
export { Router };