// ============================================
// 🔐 Auth Service
// ============================================

import { auth, db } from '../config/firebase-config.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { ROLES, COLLECTIONS } from '../config/constants.js';
import bus, { EVENTS } from '../core/events.js';
import state from '../core/state.js';
import { cleanName, sanitizeMobile } from '../utils/validation.js';

class AuthService {
  _mobileToEmail(mobile) {
    const clean = sanitizeMobile(mobile);
    return `${clean}@harvestermate.app`;
  }

  async register({ name, mobile, village, password, role = ROLES.USER }) {
    try {
      const cleanMob = sanitizeMobile(mobile);
      const cleanNm = cleanName(name);
      const email = this._mobileToEmail(cleanMob);

      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      await updateProfile(cred.user, { displayName: cleanNm });

      const isOwner = role === ROLES.OWNER;
      const userData = {
        uid,
        name: cleanNm,
        mobile: cleanMob,
        village: village || '',
        role,
        approved: role === ROLES.USER ? true : false,
        email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isActive: true
      };

      await setDoc(doc(db, COLLECTIONS.USERS, uid), userData);

      if (isOwner) {
        await setDoc(doc(db, COLLECTIONS.OWNER_REQUESTS, uid), {
          uid,
          name: cleanNm,
          mobile: cleanMob,
          village: village || '',
          status: 'pending',
          requestedAt: serverTimestamp()
        });
      }

      state.setMany({
        user: cred.user,
        userData,
        userRole: role,
        isAuthenticated: true,
        isApproved: !isOwner
      });

      localStorage.setItem('hm_user', JSON.stringify({ uid, role }));
      localStorage.setItem('hm_user_data', JSON.stringify(userData));

      bus.emit(EVENTS.AUTH_LOGIN, { uid, role });
      console.log('✅ Registration success:', uid);

      return { success: true, user: cred.user, userData };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return {
        success: false,
        error: this._errorMessage(error),
        code: error.code
      };
    }
  }

  async login(mobile, password) {
    try {
      const cleanMob = sanitizeMobile(mobile);
      const email = this._mobileToEmail(cleanMob);

      const cred = await signInWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      const userData = await this.getUserData(uid);
      if (!userData) {
        await signOut(auth);
        return { success: false, error: 'User data nahi mila.' };
      }

      if (userData.isActive === false) {
        await signOut(auth);
        return { success: false, error: 'Account deactivate ho gaya hai.' };
      }

      if (userData.role === ROLES.OWNER && !userData.approved) {
        await signOut(auth);
        return { success: false, error: 'pending_approval', role: userData.role };
      }

      state.setMany({
        user: cred.user,
        userData,
        userRole: userData.role,
        isAuthenticated: true,
        isApproved: userData.approved ?? true
      });

      localStorage.setItem('hm_user', JSON.stringify({ uid, role: userData.role }));
      localStorage.setItem('hm_user_data', JSON.stringify(userData));

      bus.emit(EVENTS.AUTH_LOGIN, { uid, role: userData.role });
      console.log('✅ Login success:', uid);

      return { success: true, user: cred.user, userData };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { success: false, error: this._errorMessage(error), code: error.code };
    }
  }

  async logout() {
    try {
      await signOut(auth);
      state.reset();
      localStorage.removeItem('hm_user');
      localStorage.removeItem('hm_user_data');
      bus.emit(EVENTS.AUTH_LOGOUT);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async sendPasswordReset(mobile) {
    try {
      await sendPasswordResetEmail(auth, this._mobileToEmail(mobile));
      return { success: true };
    } catch (error) {
      return { success: false, error: this._errorMessage(error) };
    }
  }

  async getUserData(uid) {
    try {
      const snap = await getDoc(doc(db, COLLECTIONS.USERS, uid));
      if (!snap.exists()) return null;
      return { uid, ...snap.data() };
    } catch (e) {
      console.error('getUserData failed:', e);
      return null;
    }
  }

  async updateUserData(uid, updates) {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        ...updates,
        updatedAt: serverTimestamp()
      });

      const currentData = state.get('userData') || {};
      const newData = { ...currentData, ...updates };
      state.set('userData', newData);
      localStorage.setItem('hm_user_data', JSON.stringify(newData));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async approveOwner(uid, adminUid) {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        approved: true,
        approvedAt: serverTimestamp(),
        approvedBy: adminUid
      });
      await updateDoc(doc(db, COLLECTIONS.OWNER_REQUESTS, uid), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminUid
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async rejectOwner(uid, adminUid, reason = '') {
    try {
      await updateDoc(doc(db, COLLECTIONS.USERS, uid), {
        approved: false,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason
      });
      await updateDoc(doc(db, COLLECTIONS.OWNER_REQUESTS, uid), {
        status: 'rejected',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminUid,
        reason
      });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  isLoggedIn() {
    return !!auth.currentUser;
  }

  onAuthChange(callback) {
    return onAuthStateChanged(auth, callback);
  }

  _errorMessage(error) {
    const messages = {
      'auth/email-already-in-use': 'Ye mobile number already registered hai',
      'auth/invalid-email': 'Invalid mobile format',
      'auth/weak-password': 'Password kam se kam 6 characters ka ho',
      'auth/user-not-found': 'Is number se koi account nahi mila',
      'auth/wrong-password': 'Password galat hai',
      'auth/invalid-credential': 'Mobile number ya password galat hai',
      'auth/too-many-requests': 'Bahut zyada attempts. Thodi der baad try karo',
      'auth/network-request-failed': 'Internet check karo',
      'auth/user-disabled': 'Ye account disable hai'
    };
    return messages[error.code] || error.message || 'Kuch galat ho gaya';
  }
}

const authService = new AuthService();
export default authService;