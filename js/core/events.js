// ============================================
// 📡 Event Bus
// ============================================

class EventBus {
  constructor() {
    this.events = new Map();
  }

  on(eventName, callback) {
    if (!this.events.has(eventName)) this.events.set(eventName, []);
    this.events.get(eventName).push(callback);
    return () => this.off(eventName, callback);
  }

  once(eventName, callback) {
    const wrapper = (...args) => {
      callback(...args);
      this.off(eventName, wrapper);
    };
    this.on(eventName, wrapper);
    return () => this.off(eventName, wrapper);
  }

  off(eventName, callback) {
    if (!this.events.has(eventName)) return;
    const cbs = this.events.get(eventName);
    const i = cbs.indexOf(callback);
    if (i > -1) cbs.splice(i, 1);
  }

  emit(eventName, data = null) {
    if (!this.events.has(eventName)) return;
    [...this.events.get(eventName)].forEach((cb) => {
      try { cb(data); } catch (e) { console.error(`Event "${eventName}":`, e); }
    });
  }

  clear(eventName = null) {
    if (eventName) this.events.delete(eventName);
    else this.events.clear();
  }
}

export const EVENTS = {
  AUTH_LOGIN: 'auth:login',
  AUTH_LOGOUT: 'auth:logout',
  AUTH_ERROR: 'auth:error',
  USER_LOADED: 'user:loaded',
  USER_UPDATED: 'user:updated',
  SEASON_CHANGED: 'season:changed',
  CUSTOMER_ADDED: 'customer:added',
  CUSTOMER_UPDATED: 'customer:updated',
  CUSTOMER_DELETED: 'customer:deleted',
  PAYMENT_ADDED: 'payment:added',
  PAYMENT_SUCCESS: 'payment:success',
  PAYMENT_FAILED: 'payment:failed',
  TIMER_STARTED: 'timer:started',
  TIMER_STOPPED: 'timer:stopped',
  TIMER_RESET: 'timer:reset',
  TIMER_TICK: 'timer:tick',
  ONLINE: 'network:online',
  OFFLINE: 'network:offline',
  SYNC_START: 'sync:start',
  SYNC_SUCCESS: 'sync:success',
  SYNC_FAILED: 'sync:failed',
  TOAST: 'ui:toast',
  LOADING_START: 'ui:loading:start',
  LOADING_STOP: 'ui:loading:stop',
  MODAL_OPEN: 'ui:modal:open',
  MODAL_CLOSE: 'ui:modal:close',
  WHATSAPP_SENT: 'whatsapp:sent',
  NOTIFICATION_RECEIVED: 'notification:received'
};

const bus = new EventBus();
export default bus;
export { EventBus };