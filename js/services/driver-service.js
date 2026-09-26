// ============================================
// 👤 Driver Service
// ============================================

import firestoreService from './firestore-service.js';
import state from '../core/state.js';
import { sanitizeMobile, cleanName } from '../utils/validation.js';
import { makeSeasonId } from '../utils/season-utils.js';

class DriverService {
  _path() {
    const ownerId = state.get('user')?.uid;
    const seasonId = makeSeasonId(
      state.get('selectedSeason'),
      state.get('selectedYear')
    );
    return `harvesters/${ownerId}/seasons/${seasonId}/drivers`;
  }

  async addDriver(data) {
    try {
      const driverId = `driver_${Date.now()}`;
      const driver = {
        id: driverId,
        name: cleanName(data.name),
        mobile: sanitizeMobile(data.mobile),
        assignedTo: (data.assignedTo || '').trim(),
        dailyRate: Number(data.dailyRate) || 500,
        assignedHours: Number(data.assignedHours) || 0,
        status: data.status || 'Active',
        notes: data.notes || '',
        totalPaid: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      await firestoreService.create(this._path(), driver, driverId);
      return { success: true, driver };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  async getDrivers() {
    const drivers = await firestoreService.getAll(this._path(), {
      orderBy: 'createdAt',
      orderDir: 'desc'
    });
    return drivers.filter((d) => !d.isDeleted);
  }

  async getDriver(driverId) {
    return firestoreService.getOne(`${this._path()}/${driverId}`);
  }

  async updateDriver(driverId, updates) {
    return firestoreService.update(this._path(), driverId, updates);
  }

  async deleteDriver(driverId) {
    return firestoreService.delete(this._path(), driverId);
  }

  // ===== DRIVER PAYMENT =====
  async recordPayment(driverId, amount, note = '') {
    const driver = await this.getDriver(driverId);
    if (!driver) return { success: false, error: 'Driver not found' };

    const payAmount = Math.round(Number(amount) || 0);
    if (payAmount <= 0) return { success: false, error: 'Invalid amount' };

    const newPaid = (driver.totalPaid || 0) + payAmount;

    // Payment record
    const paymentId = `dpay_${Date.now()}`;
    const payPath = `${this._path()}/${driverId}/payments`;
    await firestoreService.create(payPath, {
      id: paymentId,
      driverId,
      amount: payAmount,
      note,
      timestamp: Date.now()
    }, paymentId);

    await this.updateDriver(driverId, { totalPaid: newPaid });
    return { success: true, newPaid };
  }

  async getDriverPayments(driverId) {
    const path = `${this._path()}/${driverId}/payments`;
    return firestoreService.getAll(path, { orderBy: 'timestamp', orderDir: 'desc' });
  }
}

const driverService = new DriverService();
export default driverService;