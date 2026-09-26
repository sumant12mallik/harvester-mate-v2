// ============================================
// 🛣️ Route Helpers
// ============================================

import { ROUTES, ROLES } from './constants.js';

export function navigate(path, params = {}) {
  let url = path;
  const query = new URLSearchParams(params).toString();
  if (query) url += '?' + query;
  window.location.href = url;
}

export function navigateDelayed(path, delay = 300) {
  setTimeout(() => navigate(path), delay);
}

export function replace(path, params = {}) {
  let url = path;
  const query = new URLSearchParams(params).toString();
  if (query) url += '?' + query;
  window.location.replace(url);
}

export function goBack() {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    navigate(ROUTES.APP_HOME);
  }
}

export function getQueryParams() {
  const params = {};
  const search = window.location.search.substring(1);
  if (!search) return params;
  search.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) params[decodeURIComponent(key)] = decodeURIComponent(value || '');
  });
  return params;
}

export function getParam(key, defaultValue = null) {
  const params = getQueryParams();
  return params[key] ?? defaultValue;
}

export function buildUrl(path, params = {}) {
  const query = new URLSearchParams(params).toString();
  return query ? `${path}?${query}` : path;
}

export function getDashboardForRole(role) {
  switch (role) {
    case ROLES.ADMIN: return ROUTES.ADMIN_DASHBOARD;
    case ROLES.OWNER: return ROUTES.APP_HOME;
    case ROLES.USER: return ROUTES.USER_HOME;
    default: return ROUTES.LOGIN;
  }
}

export function goToCustomerDetail(customerId, seasonId = null) {
  const params = { id: customerId };
  if (seasonId) params.season = seasonId;
  navigate(ROUTES.CUSTOMER_DETAIL, params);
}

export function goToInvoice(customerId, seasonId = null) {
  const params = { id: customerId };
  if (seasonId) params.season = seasonId;
  navigate(ROUTES.INVOICE, params);
}

export function getCurrentPage() {
  const path = window.location.pathname;
  const parts = path.split('/');
  return parts[parts.length - 1].replace('.html', '') || 'index';
}

export function isOnPage(pageName) {
  return getCurrentPage() === pageName;
}

export function redirectToLogin() {
  const currentUrl = window.location.pathname + window.location.search;
  navigate(ROUTES.LOGIN, { redirect: encodeURIComponent(currentUrl) });
}

console.log('🛣️ Routes loaded');