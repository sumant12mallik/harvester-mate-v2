// ============================================
// 💾 IndexedDB (Offline Storage)
// ============================================

const DB_NAME = 'harvestermate_db';
const DB_VERSION = 1;
const STORES = {
  CUSTOMERS: 'customers',
  PENDING_SYNC: 'pending_sync',
  CACHE: 'cache'
};

class IndexedDB {
  constructor() {
    this.db = null;
    this.ready = false;
  }

  async init() {
    if (this.ready) return this.db;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(STORES.CUSTOMERS)) {
          db.createObjectStore(STORES.CUSTOMERS, { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
          const store = db.createObjectStore(STORES.PENDING_SYNC, {
            keyPath: 'id',
            autoIncrement: true
          });
          store.createIndex('collection', 'collection', { unique: false });
        }

        if (!db.objectStoreNames.contains(STORES.CACHE)) {
          db.createObjectStore(STORES.CACHE, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.ready = true;
        console.log('💾 IndexedDB ready');
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('💾 IndexedDB error:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  async _ensure() {
    if (!this.ready) await this.init();
    return this.db;
  }

  async _tx(storeName, mode = 'readonly') {
    const db = await this._ensure();
    return db.transaction(storeName, mode).objectStore(storeName);
  }

  async put(storeName, data) {
    const store = await this._tx(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async get(storeName, id) {
    const store = await this._tx(storeName);
    return new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll(storeName) {
    const store = await this._tx(storeName);
    return new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async delete(storeName, id) {
    const store = await this._tx(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName) {
    const store = await this._tx(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const req = store.clear();
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // ===== CACHE HELPERS =====
  async setCache(key, value, ttl = 0) {
    const expiresAt = ttl > 0 ? Date.now() + ttl : 0;
    return this.put(STORES.CACHE, { key, value, expiresAt, updatedAt: Date.now() });
  }

  async getCache(key) {
    const item = await this.get(STORES.CACHE, key);
    if (!item) return null;
    if (item.expiresAt && item.expiresAt < Date.now()) {
      await this.delete(STORES.CACHE, key);
      return null;
    }
    return item.value;
  }

  // ===== QUEUE FOR SYNC =====
  async queueSync(collection, action, docId, data) {
    return this.put(STORES.PENDING_SYNC, {
      collection, action, docId, data,
      createdAt: Date.now(),
      retries: 0
    });
  }

  async getPendingSync() {
    const items = await this.getAll(STORES.PENDING_SYNC);
    return items.sort((a, b) => a.createdAt - b.createdAt);
  }

  async clearSyncItem(id) {
    return this.delete(STORES.PENDING_SYNC, id);
  }
}

const idb = new IndexedDB();
export default idb;