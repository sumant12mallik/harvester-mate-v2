// ============================================
// 👥 Customer Service (with Manual Payments)
// ============================================

import firestoreService from './firestore-service.js';
import { ROLES, PAYMENT_MODES } from '../config/constants.js';
import state from '../core/state.js';
import { calculateAmount, roundAmount } from '../utils/currency-utils.js';
import { sanitizeMobile, cleanName } from '../utils/validation.js';
import { makeSeasonId } from '../utils/season-utils.js';

class CustomerService {
  // ===== ADD CUSTOMER =====
  async addCustomer(data) {
    const ownerId = state.get('user')?.uid;
    const season = state.get('selectedSeason');
    const year = state.get('selectedYear');
    if (!ownerId) return { success: false, error: 'Not logged in' };

    const seasonId = makeSeasonId(season, year);
    const customerId = `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const path = `harvesters/${ownerId}/seasons/${seasonId}/customers`;

    const time2W = data.time2WSec || 0;
    const time4W = data.time4WSec || 0;
    const rate2W = Number(data.rate2W) || 600;
    const rate4W = Number(data.rate4W) || 900;

    const amount2W = calculateAmount(time2W, rate2W);
    const amount4W = calculateAmount(time4W, rate4W);
    const totalAmount = amount2W + amount4W;

    const customer = {
      id: customerId,
      ownerId,
      name: cleanName(data.name),
      village: (data.village || '').trim(),
      mobile: sanitizeMobile(data.mobile),
      season,
      year,
      seasonId,
      time2WSec: time2W,
      time4WSec: time4W,
      rate2W,
      rate4W,
      amount2W,
      amount4W,
      totalAmount,
      totalPaid: 0,
      due: totalAmount,
      paymentClosed: false,
      notes: data.notes || '',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = await firestoreService.create(path, customer, customerId);
    return { success: true, customer: { ...customer, id: result.id } };
  }

  // ===== GET CUSTOMERS =====
  async getCustomers(options = {}) {
    const { seasonId = null } = options;
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return [];

    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );

    const path = `harvesters/${ownerId}/seasons/${sid}/customers`;
    const customers = await firestoreService.getAll(path, {
      orderBy: 'createdAt',
      orderDir: 'desc'
    });

    return customers.filter((c) => !c.isDeleted);
  }

  // ===== GET SINGLE =====
  async getCustomer(customerId, seasonId = null) {
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return null;

    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );

    const path = `harvesters/${ownerId}/seasons/${sid}/customers/${customerId}`;
    return firestoreService.getOne(path);
  }

  // ===== UPDATE =====
  async updateCustomer(customerId, updates, seasonId = null) {
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return { success: false };

    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );

    const current = await this.getCustomer(customerId, sid);
    if (!current) return { success: false, error: 'Customer not found' };

    const merged = { ...current, ...updates };

    const time2W = merged.time2WSec || 0;
    const time4W = merged.time4WSec || 0;
    const rate2W = Number(merged.rate2W) || 0;
    const rate4W = Number(merged.rate4W) || 0;

    const amount2W = calculateAmount(time2W, rate2W);
    const amount4W = calculateAmount(time4W, rate4W);
    const totalAmount = amount2W + amount4W;
    const due = totalAmount - (merged.totalPaid || 0);

    const finalUpdates = { ...updates, amount2W, amount4W, totalAmount, due };
    const path = `harvesters/${ownerId}/seasons/${sid}/customers/${customerId}`;

    return firestoreService.update(path, customerId, finalUpdates);
  }

  // ===== DELETE =====
  async deleteCustomer(customerId, seasonId = null) {
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return { success: false };

    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );

    const path = `harvesters/${ownerId}/seasons/${sid}/customers/${customerId}`;
    return firestoreService.delete(path, customerId);
  }

  // ===== RECORD PAYMENT (MANUAL / CASH / UPI / CHEQUE) =====
  async recordPayment(customerId, amount, mode = 'cash', note = '', seasonId = null) {
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return { success: false, error: 'Not logged in' };

    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );

    const customer = await this.getCustomer(customerId, sid);
    if (!customer) return { success: false, error: 'Customer not found' };

    const payAmount = roundAmount(amount);
    if (payAmount <= 0) return { success: false, error: 'Invalid amount' };

    const newPaid = (customer.totalPaid || 0) + payAmount;
    const newDue = (customer.totalAmount || 0) - newPaid;

    // 1. Create payment record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const paymentPath = `harvesters/${ownerId}/seasons/${sid}/customers/${customerId}/payments`;

    const payment = {
      id: paymentId,
      customerId,
      ownerId,
      seasonId: sid,
      amount: payAmount,
      mode: mode || 'cash',
      note: note || '',
      timestamp: Date.now(),
      createdAt: Date.now()
    };

    await firestoreService.create(paymentPath, payment, paymentId);

    // 2. Update customer
    await this.updateCustomer(customerId, {
      totalPaid: newPaid,
      due: newDue
    }, sid);

    // 3. Auto-close if fully paid
    let fullyPaid = false;
    if (newDue <= 0 && !customer.paymentClosed) {
      await this.updateCustomer(customerId, {
        paymentClosed: true,
        closedAt: Date.now()
      }, sid);
      fullyPaid = true;
    }

    return {
      success: true,
      payment,
      newPaid,
      newDue: Math.max(0, newDue),
      fullyPaid
    };
  }

  // ===== GET PAYMENTS =====
  async getPayments(customerId, seasonId = null) {
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return [];

    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );

    const path = `harvesters/${ownerId}/seasons/${sid}/customers/${customerId}/payments`;
    const payments = await firestoreService.getAll(path, {
      orderBy: 'timestamp',
      orderDir: 'desc'
    });
    return payments;
  }

  // ===== CLOSE PAYMENT =====
  async closePayment(customerId, seasonId = null) {
    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );
    return this.updateCustomer(customerId, {
      paymentClosed: true,
      closedAt: Date.now()
    }, sid);
  }

  // ===== SEARCH =====
  async searchCustomers(query, filterType = 'name', options = {}) {
    const { includeOtherSeasons = true } = options;
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return [];

    const q = (query || '').toString().trim().toLowerCase();
    if (!q) return [];

    const currentSeason = state.get('selectedSeason');
    const currentYear = state.get('selectedYear');
    const currentSeasonId = makeSeasonId(currentSeason, currentYear);

    const matches = [];

    const matchFn = (c) => {
      if (filterType === 'name') return (c.name || '').toLowerCase().includes(q);
      if (filterType === 'mobile') return (c.mobile || '').includes(q);
      if (filterType === 'village') return (c.village || '').toLowerCase().includes(q);
      return false;
    };

    // Current season
    const current = await this.getCustomers();
    current.forEach((c) => {
      if (matchFn(c)) {
        matches.push({ ...c, seasonId: currentSeasonId, isCurrent: true });
      }
    });

    // Old seasons
    if (includeOtherSeasons) {
      const allSeasons = this._getAllSeasonIds(currentSeasonId);
      for (const s of allSeasons) {
        const path = `harvesters/${ownerId}/seasons/${s.id}/customers`;
        const seasonCustomers = await firestoreService.getAll(path);
        seasonCustomers
          .filter((c) => !c.isDeleted && !c.paymentClosed && (c.due || 0) > 0)
          .filter(matchFn)
          .forEach((c) => {
            matches.push({
              ...c,
              seasonId: s.id,
              isCurrent: false,
              seasonLabel: s.label
            });
          });
      }
    }

    // Sort current first
    return matches.sort((a, b) => {
      if (a.isCurrent && !b.isCurrent) return -1;
      if (!a.isCurrent && b.isCurrent) return 1;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }

  // ===== GET OLD DUES =====
  async getOldDues(customerMobile, currentSeasonId = null) {
    const ownerId = state.get('user')?.uid;
    if (!ownerId || !customerMobile) return [];

    const dues = [];
    const allSeasons = this._getAllSeasonIds(currentSeasonId);

    for (const s of allSeasons) {
      try {
        const path = `harvesters/${ownerId}/seasons/${s.id}/customers`;
        const customers = await firestoreService.getAll(path);
        customers
          .filter((c) => c.mobile === customerMobile && !c.paymentClosed && c.due > 0)
          .forEach((c) => dues.push({ ...c, seasonLabel: s.label }));
      } catch (e) {}
    }

    return dues;
  }

  _getAllSeasonIds(currentSeasonId = null) {
    const currentSeason = state.get('selectedSeason');
    const currentYear = state.get('selectedYear');
    const list = [];
    const now = new Date();
    const allSeasons = ['Kharif', 'Rabi', 'Zaid'];

    // Last 4 years
    for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) {
      allSeasons.forEach((s) => {
        const id = makeSeasonId(s, String(y));
        if (id !== currentSeasonId) {
          list.push({ id, label: `${s} ${y}` });
        }
      });
    }

    return list;
  }
}

const customerService = new CustomerService();
export default customerService;