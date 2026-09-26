// ============================================
// 🔥 Firebase Configuration
// ============================================

export const firebaseConfig = {
  apiKey: "AIzaSyCwvSiFyQh_Buj2OMvqfS0F_-N81ZHSGcE",
  authDomain: "home-automation-esp-75bb6.firebaseapp.com",
  databaseURL: "https://home-automation-esp-75bb6-default-rtdb.firebaseio.com",
  projectId: "home-automation-esp-75bb6",
  storageBucket: "home-automation-esp-75bb6.firebasestorage.app",
  messagingSenderId: "825480013715",
  appId: "1:825480013715:web:f5368b461fabee77fe2a66",
  measurementId: "G-FQVFDT2FZ0"
};

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-storage.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-functions.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-analytics.js";

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'asia-south1');

let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  console.warn('⚠️ Analytics not available:', e.message);
}
export { analytics };

console.log('🔥 Firebase initialized:', firebaseConfig.projectId);