// ============================================
// 📌 App Constants
// ============================================

export const APP = {
  NAME: 'HarvesterMate',
  VERSION: '2.0.0',
  CURRENCY: '₹',
  SUPPORT_EMAIL: 'support@harvestermate.app',
  SUPPORT_PHONE: '+919999999999'
};

export const ROLES = {
  ADMIN: 'admin',
  OWNER: 'owner',
  USER: 'user'
};

export const ROUTES = {
  HOME: '/index.html',
  OFFLINE: '/offline.html',
  
  LOGIN: '/pages/auth/login.html',
  REGISTER: '/pages/auth/register.html',
  FORGOT_PASSWORD: '/pages/auth/forgot-password.html',
  APPROVAL_PENDING: '/pages/auth/approval-pending.html',
  ADMIN_LOGIN: '/pages/auth/admin-login.html',
  
  APP_HOME: '/pages/app/home.html',
  CUSTOMERS: '/pages/app/customers.html',
  CUSTOMER_DETAIL: '/pages/app/customer-detail.html',
  ADD_CUSTOMER: '/pages/app/add-customer.html',
  DRIVERS: '/pages/app/drivers.html',
  ADD_DRIVER: '/pages/app/add-driver.html',
  WORK: '/pages/app/work.html',
  EXPENSE: '/pages/app/expense.html',
  DIESEL: '/pages/app/diesel.html',
  SEASON_RECORDS: '/pages/app/season-records.html',
  DEALER: '/pages/app/dealer.html',
  REPORTS: '/pages/app/reports.html',
  SETTINGS: '/pages/app/settings.html',
  MORE: '/pages/app/more.html',
  PAYMENTS: '/pages/app/payments.html',
  INVOICE: '/pages/app/invoice.html',
  SEARCH: '/pages/app/search.html',
  
  ADMIN_DASHBOARD: '/pages/admin/dashboard.html',
  ADMIN_REQUESTS: '/pages/admin/requests.html',
  ADMIN_USERS: '/pages/admin/users.html',
  
  USER_HOME: '/pages/user/user-home.html',
  
  PRIVACY: '/pages/legal/privacy-policy.html',
  TERMS: '/pages/legal/terms-conditions.html',
  DATA_DELETION: '/pages/legal/data-deletion.html',
  REFUND: '/pages/legal/refund-policy.html',
  ABOUT: '/pages/legal/about.html',
  CONTACT: '/pages/legal/contact.html',
  FAQ: '/pages/legal/faq.html'
};

export const SEASONS = {
  KHARIF: 'Kharif',
  RABI: 'Rabi',
  ZAID: 'Zaid'
};

export const SEASON_MONTHS = {
  Kharif: 'Jun - Oct',
  Rabi: 'Nov - Mar',
  Zaid: 'Apr - May'
};

export const TIMER = {
  DEFAULT_RATE_2W: 600,
  DEFAULT_RATE_4W: 900,
  TICK_INTERVAL: 1000,
  MAX_HOURS: 24
};

export const PAYMENT_MODES = {
  CASH: 'cash',
  UPI: 'upi',
  ONLINE: 'online',
  CHEQUE: 'cheque'
};

export const STORAGE_KEYS = {
  THEME: 'hm_theme',
  USER: 'hm_user',
  USER_DATA: 'hm_user_data',
  TIMER_STATE: 'hm_timer_state',
  SELECTED_SEASON: 'hm_selected_season',
  SELECTED_YEAR: 'hm_selected_year',
  SEASON_HISTORY: 'hm_season_history',
  PENDING_SYNC: 'hm_pending_sync'
};

export const COLLECTIONS = {
  USERS: 'users',
  OWNER_REQUESTS: 'owner_requests',
  HARVESTERS: 'harvesters',
  NOTIFICATIONS: 'notifications',
  DELETION_REQUESTS: 'deletion_requests'
};

export const VALIDATION = {
  MOBILE_LENGTH: 10,
  PASSWORD_MIN_LENGTH: 6,
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 50,
  VILLAGE_MAX_LENGTH: 60,
  NOTE_MAX_LENGTH: 500
};

export const UI = {
  TOAST_DURATION: 3000,
  SPLASH_DURATION: 2500,
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 400,
  PAGINATION_SIZE: 20
};

console.log('📌 Constants loaded');