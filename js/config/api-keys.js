// ============================================
// 🔑 API Keys & Feature Flags
// ============================================

export const API_KEYS = {
  RAZORPAY_KEY_ID: "rzp_test_REPLACE_ME",
  WHATSAPP_TOKEN: "",
  WHATSAPP_PHONE_ID: "",
  GOOGLE_MAPS_KEY: "",
  GA_MEASUREMENT_ID: "G-FQVFDT2FZ0"
};

export const ENV = {
  IS_PRODUCTION: window.location.hostname === 'harvestermate.app',
  IS_DEVELOPMENT: window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1',
  IS_STAGING: window.location.hostname.includes('deploy-preview')
};

export const FEATURES = {
  ENABLE_ONLINE_PAYMENT: false,
  ENABLE_WHATSAPP_AUTO: true,
  ENABLE_OFFLINE_SYNC: true,
  ENABLE_PWA: true,
  ENABLE_ANALYTICS: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_CHARTS: true,
  ENABLE_PDF_INVOICE: true,
  ENABLE_MULTI_LANGUAGE: false
};

console.log('🔑 API keys loaded');