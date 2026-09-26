// ============================================
// 🛡️ Route Guards
// ============================================

import { auth, db } from '../config/firebase-config.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { ROLES, ROUTES, COLLECTIONS, STORAGE_KEYS } from '../config/constants.js';
import state from './state.js';
import { redirectToLogin } from '../config/routes.js';

const PUBLIC_ROUTES = [
  '/', '/index.html', '/offline.html',
  '/pages/auth/login.html',
  '/pages/auth/register.html',
  '/pages/auth/forgot-password.html',
  '/pages/auth/approval-pending.html',
  '/pages/auth/admin-login.html',
  '/pages/legal/privacy-policy.html',
  '/pages/legal/terms-conditions.html',
  '/pages/legal/data-deletion.html',
  '/pages/legal/refund-policy.html',
  '/pages/legal/about.html',
  '/pages/legal/contact.html',
  '/pages/legal/faq.html'
];

const ROLE_ROUTES = {
  '/pages/app/': [ROLES.OWNER, ROLES.ADMIN],
  '/pages/admin/': [ROLES.ADMIN],
  '/pages/user/': [ROLES.USER, ROLES.OWNER, ROLES.ADMIN]
};

export function isPublicRoute(path = window.location.pathname) {
  return PUBLIC_ROUTES.some((p) => path === p || path.startsWith(p));
}

function getRequiredRoles(path) {
  for (const [prefix, roles] of Object.entries(ROLE_ROUTES)) {
    if (path.startsWith(prefix)) return roles;
  }
  return null;
}

export function waitForAuth() {
  return new Promise((resolve) => {
    const unsub = auth.onAuthStateChanged((user) => {
      unsub();
      resolve(user);
    });
  });
}

export async function fetchUserData(uid) {
  try {
    const ref = doc(db, COLLECTIONS.USERS, uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return { uid, ...snap.data() };
  } catch (e) {
    console.error('fetchUserData failed:', e);
    return null;
  }
}

export async function protectPage() {
  const path = window.location.pathname;

  if (isPublicRoute(path)) return { allowed: true };

  const user = await waitForAuth();
  if (!user) {
    console.log('🔒 Not logged in');
    redirectToLogin();
    return { allowed: false, reason: 'not-authenticated' };
  }

  const userData = await fetchUserData(user.uid);
  if (!userData) {
    console.warn('⚠️ No user data');
    await auth.signOut();
    redirectToLogin();
    return { allowed: false, reason: 'no-user-data' };
  }

  state.setMany({
    user,
    userData,
    userRole: userData.role,
    isAuthenticated: true,
    isApproved: userData.approved ?? false
  });

  if (userData.role === ROLES.OWNER && !userData.approved) {
    window.location.href = ROUTES.APPROVAL_PENDING;
    return { allowed: false, reason: 'pending-approval' };
  }

  const required = getRequiredRoles(path);
  if (required && !required.includes(userData.role)) {
    console.warn('🚫 Access denied:', userData.role);
    window.location.href = ROUTES.APP_HOME;
    return { allowed: false, reason: 'wrong-role' };
  }

  console.log('✅ Access granted:', userData.role);
  return { allowed: true, userData };
}

export function isLoggedIn() { return state.get('isAuthenticated') === true; }
export function isOwner() { return state.get('userRole') === ROLES.OWNER; }
export function isAdmin() { return state.get('userRole') === ROLES.ADMIN; }
export function isApprovedOwner() { return isOwner() && state.get('isApproved') === true; }

console.log('🛡️ Guards loaded');