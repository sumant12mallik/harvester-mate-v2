// ============================================
// 🌾 Splash Screen
// ============================================

import { auth } from '../config/firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { ROUTES } from '../config/constants.js';
import { getDashboardForRole } from '../config/routes.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { db } from '../config/firebase-config.js';

console.log('🌾 Splash loaded');

const SPLASH_DURATION = 2500;

// Wait for auth + splash delay, then redirect
async function bootstrap() {
  const startTime = Date.now();

  // Wait for auth state
  const user = await new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, (u) => {
      unsub();
      resolve(u);
    });
  });

  // Ensure minimum splash duration
  const elapsed = Date.now() - startTime;
  const wait = Math.max(0, SPLASH_DURATION - elapsed);
  await new Promise((r) => setTimeout(r, wait));

  // Redirect
  if (!user) {
    console.log('→ Login');
    window.location.href = ROUTES.LOGIN;
    return;
  }

  // Get user data
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (!snap.exists()) {
      window.location.href = ROUTES.LOGIN;
      return;
    }

    const data = snap.data();
    localStorage.setItem('hm_user', JSON.stringify({ uid: user.uid, role: data.role }));
    localStorage.setItem('hm_user_data', JSON.stringify(data));

    if (data.role === 'owner' && !data.approved) {
      console.log('→ Approval pending');
      window.location.href = ROUTES.APPROVAL_PENDING;
      return;
    }

    const target = getDashboardForRole(data.role);
    console.log('→', target);
    window.location.href = target;

  } catch (e) {
    console.error('Splash error:', e);
    window.location.href = ROUTES.LOGIN;
  }
}

bootstrap();