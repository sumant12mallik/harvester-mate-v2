// ============================================
// 📊 Report Service
// ============================================

import customerService from './customer-service.js';
import driverService from './driver-service.js';
import firestoreService from './firestore-service.js';
import { makeSeasonId } from '../utils/season-utils.js';
import state from '../core/state.js';

class ReportService {
  async _loadCollection(ownerId, seasonId, subcollection) {
    const path = `harvesters/${ownerId}/seasons/${seasonId}/${subcollection}`;
    return firestoreService.getAll(path, { orderBy: 'createdAt', orderDir: 'desc' });
  }

  async getSeasonReport(seasonId = null) {
    const ownerId = state.get('user')?.uid;
    if (!ownerId) return null;

    const sid = seasonId || makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );

    try {
      const [customers, drivers, expenses, diesel, repairs, dealers] = await Promise.all([
        customerService.getCustomers({ seasonId: sid }),
        driverService.getDrivers(),
        this._loadCollection(ownerId, sid, 'expenses'),
        this._loadCollection(ownerId, sid, 'diesel'),
        this._loadCollection(ownerId, sid, 'repairs'),
        this._loadCollection(ownerId, sid, 'dealer_ledger')
      ]);

      // Earnings
      const totalWork = customers.reduce((s, c) => s + (c.totalAmount || 0), 0);
      const totalPaid = customers.reduce((s, c) => s + (c.totalPaid || 0), 0);
      const totalDue = customers.reduce((s, c) => s + (c.due || 0), 0);
      const amount2W = customers.reduce((s, c) => s + (c.amount2W || 0), 0);
      const amount4W = customers.reduce((s, c) => s + (c.amount4W || 0), 0);
      const totalTime2W = customers.reduce((s, c) => s + (c.time2WSec || 0), 0);
      const totalTime4W = customers.reduce((s, c) => s + (c.time4WSec || 0), 0);

      // Expenses
      const totalDiesel = diesel.reduce((s, d) => s + (d.totalCost || 0), 0);
      const totalRepair = repairs.reduce((s, r) => s + (r.cost || 0), 0);
      const totalExpense = expenses.reduce((s, e) => s + (e.amount || 0), 0);
      const driverPaid = drivers.reduce((s, d) => s + (d.totalPaid || 0), 0);

      const totalExpenses = totalDiesel + totalRepair + totalExpense + driverPaid;
      const netProfit = totalWork - totalExpenses;
      const profitMargin = totalWork > 0 ? ((netProfit / totalWork) * 100).toFixed(1) : '0';

      const totalCustomers = customers.length;
      const paidCustomers = customers.filter((c) => c.paymentClosed).length;
      const dueCustomers = customers.filter((c) => (c.due || 0) > 0 && !c.paymentClosed).length;

      // Diesel liters
      const totalLiters = diesel.reduce((s, d) => s + (d.liters || 0), 0);

      const expenseBreakdown = [
        { label: 'Diesel', amount: totalDiesel, color: '#FFA726', icon: '⛽' },
        { label: 'Repair', amount: totalRepair, color: '#4A9EFF', icon: '🔧' },
        { label: 'Personal', amount: totalExpense, color: '#FF4757', icon: '💵' },
        { label: 'Driver', amount: driverPaid, color: '#9C6FFF', icon: '👤' }
      ].filter((e) => e.amount > 0);

      const monthlyData = this._buildMonthlyBreakdown(customers, expenses, diesel);

      return {
        seasonId: sid,
        generatedAt: Date.now(),
        totalWork, totalPaid, totalDue,
        amount2W, amount4W,
        totalTime2W, totalTime4W,
        totalDiesel, totalRepair, totalExpense, driverPaid, totalExpenses,
        netProfit, profitMargin,
        totalCustomers, paidCustomers, dueCustomers,
        totalLiters,
        monthlyData,
        expenseBreakdown
      };
    } catch (e) {
      console.error('Report failed:', e);
      return null;
    }
  }

  async getTodaySummary() {
    const customers = await customerService.getCustomers();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCustomers = customers.filter((c) => {
      const t = c.createdAt;
      return t >= today.getTime() && t < tomorrow.getTime();
    });

    const totalTime = todayCustomers.reduce(
      (s, c) => s + (c.time2WSec || 0) + (c.time4WSec || 0), 0
    );
    const totalAmount = todayCustomers.reduce((s, c) => s + (c.totalAmount || 0), 0);
    const totalPaid = todayCustomers.reduce((s, c) => s + (c.totalPaid || 0), 0);

    return {
      count: todayCustomers.length,
      totalTime,
      totalAmount,
      totalPaid,
      pending: totalAmount - totalPaid
    };
  }

  async getWeeklyUsage() {
    const customers = await customerService.getCustomers();
    const days = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const dayCustomers = customers.filter((c) =>
        c.createdAt >= d.getTime() && c.createdAt < next.getTime()
      );
      const dayTime = dayCustomers.reduce(
        (s, c) => s + (c.time2WSec || 0) + (c.time4WSec || 0), 0
      );

      days.push({
        date: d,
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        hours: (dayTime / 3600).toFixed(1),
        seconds: dayTime
      });
    }

    const max = Math.max(...days.map((d) => d.seconds), 1);
    return days.map((d) => ({ ...d, percent: Math.round((d.seconds / max) * 100) }));
  }

  async getTopDues(limitCount = 5) {
    const customers = await customerService.getCustomers();
    return [...customers]
      .filter((c) => (c.due || 0) > 0)
      .sort((a, b) => (b.due || 0) - (a.due || 0))
      .slice(0, limitCount)
      .map((c) => ({
        id: c.id,
        name: c.name,
        village: c.village,
        mobile: c.mobile,
        due: c.due
      }));
  }

  async getTopCustomers(limitCount = 5) {
    const customers = await customerService.getCustomers();
    return [...customers]
      .sort((a, b) => (b.totalAmount || 0) - (a.totalAmount || 0))
      .slice(0, limitCount);
  }

  _buildMonthlyBreakdown(customers, expenses, diesel) {
    const months = {};
    const add = (month, key, amount) => {
      if (!months[month]) months[month] = { month, earnings: 0, expenses: 0, diesel: 0, profit: 0 };
      months[month][key] += amount;
    };

    customers.forEach((c) => {
      const m = new Date(c.createdAt).toLocaleDateString('en-IN', { month: 'short' });
      add(m, 'earnings', c.totalAmount || 0);
    });
    expenses.forEach((e) => {
      const m = new Date(e.createdAt).toLocaleDateString('en-IN', { month: 'short' });
      add(m, 'expenses', e.amount || 0);
    });
    diesel.forEach((d) => {
      const m = new Date(d.createdAt).toLocaleDateString('en-IN', { month: 'short' });
      add(m, 'diesel', d.totalCost || 0);
    });

    Object.values(months).forEach((m) => {
      m.profit = m.earnings - m.expenses - m.diesel;
    });

    return Object.values(months).slice(-6);
  }

  async exportCustomersCSV() {
    const customers = await customerService.getCustomers();
    const headers = [
      'Name', 'Village', 'Mobile',
      'Time 2W (min)', 'Time 4W (min)',
      'Rate 2W', 'Rate 4W',
      'Amount 2W', 'Amount 4W',
      'Total', 'Paid', 'Due', 'Status'
    ];

    const rows = customers.map((c) => [
      this._csv(c.name || ''),
      this._csv(c.village || ''),
      c.mobile || '',
      Math.round((c.time2WSec || 0) / 60),
      Math.round((c.time4WSec || 0) / 60),
      c.rate2W || 0,
      c.rate4W || 0,
      c.amount2W || 0,
      c.amount4W || 0,
      c.totalAmount || 0,
      c.totalPaid || 0,
      c.due || 0,
      c.paymentClosed ? 'Paid' : (c.due > 0 ? 'Due' : 'Open')
    ]);

    return [headers, ...rows].map((r) => r.join(',')).join('\n');
  }

  _csv(str) {
    if (str == null) return '';
    const s = String(str);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  }
}

const reportService = new ReportService();
export default reportService;