// ============================================
// 👥 Admin All Users
// ============================================

import { db } from '../config/firebase-config.js';
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";
import toast from '../ui/toast.js';
import { getInitials, debounce } from '../utils/formatter.js';
import logger from '../utils/logger.js';

class AdminUsersPage {
  constructor() {
    this.allUsers = [];
    this.currentFilter = 'all';
    this.searchQuery = '';
  }

  async init() {
    logger.info('👥 Admin users init');

    this.listEl = document.getElementById('usersList');
    this.countEl = document.getElementById('countLabel');
    this.searchInput = document.getElementById('searchInput');

    this.setupListeners();
    await this.load();
  }

  setupListeners() {
    this.searchInput?.addEventListener('input', debounce((e) => {
      this.searchQuery = e.target.value.toLowerCase().trim();
      this.applyFilters();
    }, 300));

    document.querySelectorAll('[data-filter]').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('[data-filter]').forEach((t) => t.classList.remove('active'));
        tab.classList.add('active');
        this.currentFilter = tab.dataset.filter;
        this.applyFilters();
      });
    });
  }

  async load() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      this.allUsers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));
      this.applyFilters();
    } catch (e) {
      logger.error('Load failed:', e);
      toast.error('Load fail');
    }
  }

  applyFilters() {
    let list = [...this.allUsers];

    if (this.currentFilter !== 'all') {
      list = list.filter((u) => u.role === this.currentFilter);
    }

    if (this.searchQuery) {
      const q = this.searchQuery;
      list = list.filter((u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.mobile || '').includes(q) ||
        (u.village || '').toLowerCase().includes(q)
      );
    }

    if (this.countEl) this.countEl.textContent = `${list.length} user${list.length === 1 ? '' : 's'}`;

    if (!list.length) {
      this.listEl.innerHTML = `
        <div class="card" style="text-align:center;padding:40px;">
          <div style="font-size:48px;opacity:0.3;">👥</div>
          <p style="color:#7A8BA8;font-size:13px;margin-top:12px;">Koi user nahi mila</p>
        </div>`;
      return;
    }

    const roleColors = {
      owner: '#00FF88',
      user: '#4A9EFF',
      admin: '#FF4757'
    };

    this.listEl.innerHTML = list.map((u) => {
      const color = roleColors[u.role] || roleColors.user;
      const isApproved = u.approved !== false;
      return `
        <div class="customer-card">
          <div class="customer-avatar">${getInitials(u.name)}</div>
          <div class="customer-info">
            <div class="customer-name">${this._esc(u.name)} ${!isApproved ? '⏳' : ''}</div>
            <div class="customer-meta">
              ${this._esc(u.mobile || '')} ${u.village ? '• ' + this._esc(u.village) : ''}
            </div>
          </div>
          <span style="font-size:10px;font-weight:700;color:${color};background:${color}22;padding:3px 8px;border-radius:12px;">
            ${u.role || 'user'}
          </span>
        </div>
      `;
    }).join('');
  }

  _esc(s) {
    if (!s) return '';
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }
}

const page = new AdminUsersPage();
document.addEventListener('DOMContentLoaded', () => page.init());