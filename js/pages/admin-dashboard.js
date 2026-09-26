// ============================================
// 🛡️ Admin Dashboard
// ============================================

import { auth, db } from '../config/firebase-config.js';
import { signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import { ROUTES } from '../config/constants.js';
import { navigate } from '../config/routes.js';
import logger from '../utils/logger.js';

class AdminDashboard {
  async init() {
    logger.info('🛡️ Admin dashboard init');

    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate(ROUTES.ADMIN_LOGIN);
        return;
      }

      // Verify admin role
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        if (!snap.exists() || snap.data().role !== 'admin') {
          toast.error('Admin access required');
          await signOut(auth);
          setTimeout(() => navigate(ROUTES.ADMIN_LOGIN), 1200);
          return;
        }
        await this.loadStats();
      } catch (e) {
        logger.error('Admin check failed:', e);
      }
    });

    document.getElementById('logoutBtn')?.addEventListener('click', () => this.logout());
  }

  async loadStats() {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const users = usersSnap.docs.map((d) => d.data());

      const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      set('statOwners', users.filter((u) => u.role === 'owner').length);
      set('statUsers', users.filter((u) => u.role === 'user').length);

      const reqSnap = await getDocs(collection(db, 'owner_requests'));
      const reqs = reqSnap.docs.map((d) => d.data());
      set('statPending', reqs.filter((r) => r.status === 'pending').length);
      set('statRequests', reqs.length);
    } catch (e) {
      logger.error('Stats failed:', e);
    }
  }

  async logout() {
    const ok = await modal.confirm({
      title: 'Logout',
      message: 'Admin logout karna hai?',
      confirmText: 'Logout',
      confirmVariant: 'danger'
    });
    if (!ok) return;
    await signOut(auth);
    localStorage.clear();
    navigate(ROUTES.ADMIN_LOGIN);
  }
}

const page = new AdminDashboard();
document.addEventListener('DOMContentLoaded', () => page.init());