// ============================================
// 📋 Admin Owner Requests
// ============================================

import { auth, db } from '../config/firebase-config.js';
import { collection, getDocs, doc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import toast from '../ui/toast.js';
import modal from '../ui/modal.js';
import whatsappService from '../services/whatsapp-service.js';
import logger from '../utils/logger.js';

class AdminRequestsPage {
  constructor() {
    this.allRequests = [];
    this.currentStatus = 'pending';
  }

  async init() {
    logger.info('📋 Admin requests init');

    this.listEl = document.getElementById('requestsList');
    this.emptyEl = document.getElementById('emptyState');

    this.setupListeners();
    await this.load();
  }

  setupListeners() {
    document.querySelectorAll('[data-status]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-status]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentStatus = tab.dataset.status;
        this.render();
      });
    });
  }

  async load() {
    try {
      const snap = await getDocs(collection(db, 'owner_requests'));
      this.allRequests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      this.render();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Load fail');
    }
  }

  render() {
    const list = this.allRequests.filter((r) => r.status === this.currentStatus);

    if (!list.length) {
      this.listEl.innerHTML = '';
      this.emptyEl.style.display = 'block';
      return;
    }

    this.emptyEl.style.display = 'none';

    this.listEl.innerHTML = list.map((r) => {
      const isPending = r.status === 'pending';
      const isApproved = r.status === 'approved';
      const color = isPending ? '#FFA726' : isApproved ? '#00FF88' : '#FF4757';
      const text = isPending ? 'PENDING' : isApproved ? 'APPROVED' : 'REJECTED';

      return `
        <div class="card" style="padding:16px;margin-bottom:12px;">
          <div style="display:flex;gap:12px;margin-bottom:12px;">
            <div class="customer-avatar">${(r.name || '?').charAt(0).toUpperCase()}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-weight:700;color:#fff;font-size:15px;">${this._esc(r.name)}</div>
              <div style="font-size:12px;color:#7A8BA8;margin-top:4px;">
                📍 ${this._esc(r.village || '—')} • 📞 +91 ${this._esc(r.mobile || '')}
              </div>
            </div>
            <span style="font-size:10px;font-weight:700;color:${color};background:${color}22;padding:4px 10px;border-radius:20px;height:fit-content;white-space:nowrap;">${text}</span>
          </div>
          ${isPending ? `
            <div style="display:flex;gap:8px;">
              <button class="btn btn-secondary btn-sm" data-reject="${r.id}" style="flex:1;color:#FF4757;border-color:#FF4757;">✗ Reject</button>
              <button class="btn btn-primary btn-sm" data-approve="${r.id}" style="flex:1;">✓ Approve</button>
            </div>
          ` : `
            <div style="font-size:11px;color:#7A8BA8;">
              ${isApproved ? '✅ Approved' : '❌ Rejected'}
            </div>
          `}
        </div>
      `;
    }).join('');

    this.listEl.querySelectorAll('[data-approve]').forEach((btn) => {
      btn.addEventListener('click', () => this.approve(btn.dataset.approve));
    });
    this.listEl.querySelectorAll('[data-reject]').forEach((btn) => {
      btn.addEventListener('click', () => this.reject(btn.dataset.reject));
    });
  }

  async approve(id) {
    const req = this.allRequests.find((r) => r.id === id);
    const ok = await modal.confirm({
      title: 'Approve Owner',
      message: `${req.name} ko approve karna hai?`,
      confirmText: 'Approve'
    });
    if (!ok) return;

    try {
      const adminUid = auth.currentUser?.uid;

      await updateDoc(doc(db, 'owner_requests', id), {
        status: 'approved',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminUid
      });

      await updateDoc(doc(db, 'users', id), { approved: true });

      // WhatsApp
      try {
        await whatsappService.sendApprovalMessage({ name: req.name, mobile: req.mobile });
      } catch (e) {}

      toast.success(`${req.name} approved!`);
      req.status = 'approved';
      this.render();
    } catch (e) {
      logger.error('Approve failed:', e);
      toast.error('Approve fail');
    }
  }

  async reject(id) {
    const req = this.allRequests.find((r) => r.id === id);
    const reason = await modal.prompt({
      title: 'Reject Reason',
      message: `${req.name} ka request reject karne ka reason:`,
      confirmText: 'Reject'
    });

    if (reason === null) return;

    try {
      const adminUid = auth.currentUser?.uid;
      await updateDoc(doc(db, 'owner_requests', id), {
        status: 'rejected',
        reason: reason || '',
        reviewedAt: serverTimestamp(),
        reviewedBy: adminUid
      });

      try {
        await whatsappService.sendRejectionMessage({
          name: req.name,
          mobile: req.mobile,
          reason: reason || ''
        });
      } catch (e) {}

      toast.success(`${req.name} rejected`);
      req.status = 'rejected';
      this.render();
    } catch (e) {
      toast.error('Reject fail');
    }
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new AdminRequestsPage();
document.addEventListener('DOMContentLoaded', () => page.init());