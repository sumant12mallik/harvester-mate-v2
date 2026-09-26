// ============================================
// 🔔 Notification Service
// ============================================

import { db } from '../config/firebase-config.js';
import {
  collection, addDoc, getDocs, query, where,
  orderBy, limit, updateDoc, doc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

import { COLLECTIONS } from '../config/constants.js';
import state from '../core/state.js';
import bus, { EVENTS } from '../core/events.js';
import toast from '../ui/toast.js';
import logger from '../utils/logger.js';

class NotificationService {
  constructor() {
    this.permission = 'default';
    this.notifications = [];
  }

  async init() {
    if (!('Notification' in window)) return;
    this.permission = Notification.permission;
  }

  async requestPermission() {
    if (!('Notification' in window)) return false;
    try {
      const p = await Notification.requestPermission();
      this.permission = p;
      return p === 'granted';
    } catch (e) {
      return false;
    }
  }

  async showLocal(title, options = {}) {
    if (!('Notification' in window)) return null;
    if (this.permission !== 'granted') {
      toast.info(title);
      return null;
    }

    try {
      const n = new Notification(title, {
        body: options.body || '',
        icon: options.icon || '/assets/icons/pwa/icon-192.png',
        badge: '/assets/icons/pwa/icon-96.png',
        tag: options.tag || 'harvestermate'
      });

      n.onclick = () => {
        window.focus();
        if (options.url) window.location.href = options.url;
        n.close();
      };

      bus.emit(EVENTS.NOTIFICATION_RECEIVED, { title, ...options });
      return n;
    } catch (e) {
      logger.error('Notification failed:', e);
      toast.info(title);
      return null;
    }
  }

  async createInApp({ title, message, type = 'info', link = null, targetUid = null }) {
    const uid = targetUid || state.get('user')?.uid;
    if (!uid) return null;

    try {
      const data = {
        uid,
        title,
        message,
        type,
        link,
        read: false,
        createdAt: Date.now(),
        serverTime: serverTimestamp()
      };

      const ref = await addDoc(collection(db, COLLECTIONS.NOTIFICATIONS), data);
      toast.show({ message: title, type });
      return { id: ref.id, ...data };
    } catch (e) {
      logger.error('In-app notification failed:', e);
      return null;
    }
  }

  async getNotifications(uid = null) {
    const userId = uid || state.get('user')?.uid;
    if (!userId) return [];

    try {
      const q = query(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        where('uid', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snap = await getDocs(q);
      this.notifications = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return this.notifications;
    } catch (e) {
      return [];
    }
  }

  async markAsRead(notifId) {
    try {
      await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, notifId), {
        read: true,
        readAt: serverTimestamp()
      });
      const notif = this.notifications.find((n) => n.id === notifId);
      if (notif) notif.read = true;
      return true;
    } catch (e) {
      return false;
    }
  }

  async markAllAsRead() {
    const unread = this.notifications.filter((n) => !n.read);
    for (const n of unread) {
      await this.markAsRead(n.id);
    }
    return true;
  }

  async getUnreadCount() {
    const list = await this.getNotifications();
    return list.filter((n) => !n.read).length;
  }

  // ===== PRESETS =====
  async notifyNewCustomer(customer) {
    return this.createInApp({
      title: '👤 New Customer Added',
      message: `${customer.name} — ${customer.village}`,
      type: 'success',
      link: `/pages/app/customer-detail.html?id=${customer.id}`
    });
  }

  async notifyPaymentReceived({ amount, customer }) {
    return this.createInApp({
      title: `💰 Payment: ₹${amount}`,
      message: `${customer.name} ne payment kiya`,
      type: 'success'
    });
  }
}

const notificationService = new NotificationService();
export default notificationService;