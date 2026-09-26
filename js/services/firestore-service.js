// ============================================
// 🔥 Firestore Service (Generic CRUD)
// ============================================

import { db } from '../config/firebase-config.js';
import {
  collection, doc, addDoc, setDoc, getDoc, getDocs,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

class FirestoreService {
  async create(collectionPath, data, customId = null) {
    try {
      const payload = {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      if (customId) {
        await setDoc(doc(db, collectionPath, customId), payload);
        return { id: customId, data: payload };
      }

      const ref = await addDoc(collection(db, collectionPath), payload);
      return { id: ref.id, data: { id: ref.id, ...payload } };
    } catch (error) {
      console.error('Firestore create failed:', error);
      throw error;
    }
  }

  async getOne(collectionPath, docId) {
    try {
      const snap = await getDoc(doc(db, collectionPath, docId));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error('Firestore getOne failed:', error);
      return null;
    }
  }

  async getAll(collectionPath, options = {}) {
    const {
      where: whereClauses = [],
      orderBy: orderField = null,
      orderDir = 'desc',
      limitCount = null
    } = options;

    try {
      const constraints = [];
      whereClauses.forEach(([field, op, value]) => {
        constraints.push(where(field, op, value));
      });
      if (orderField) constraints.push(orderBy(orderField, orderDir));
      if (limitCount) constraints.push(limit(limitCount));

      const q = query(collection(db, collectionPath), ...constraints);
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (error) {
      console.error('Firestore getAll failed:', error);
      return [];
    }
  }

  async update(collectionPath, docId, updates) {
    try {
      const payload = { ...updates, updatedAt: serverTimestamp() };
      await updateDoc(doc(db, collectionPath, docId), payload);
      return { success: true };
    } catch (error) {
      console.error('Firestore update failed:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(collectionPath, docId, hardDelete = false) {
    try {
      if (hardDelete) {
        await deleteDoc(doc(db, collectionPath, docId));
      } else {
        await updateDoc(doc(db, collectionPath, docId), {
          isDeleted: true,
          deletedAt: serverTimestamp()
        });
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  subscribe(collectionPath, options = {}, callback) {
    const { where: whereClauses = [], orderBy: orderField = null, orderDir = 'desc' } = options;
    const constraints = [];
    whereClauses.forEach(([f, o, v]) => constraints.push(where(f, o, v)));
    if (orderField) constraints.push(orderBy(orderField, orderDir));

    const q = query(collection(db, collectionPath), ...constraints);
    return onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(data);
    });
  }

  timestamp() {
    return serverTimestamp();
  }
}

const firestoreService = new FirestoreService();
export default firestoreService;