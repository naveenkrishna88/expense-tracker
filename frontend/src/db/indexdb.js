const DB_NAME = 'ExpenseFlowDB';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('groups')) {
        db.createObjectStore('groups', { keyPath: 'group_id' });
      }
      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'queue_id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================
// CACHE TRANSACTIONS
// ==========================
export async function cacheTransactions(transactions) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readwrite');
    const store = tx.objectStore('transactions');
    store.clear();
    transactions.forEach(t => store.put(t));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedTransactions() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const store = tx.objectStore('transactions');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ==========================
// CACHE GROUPS
// ==========================
export async function cacheGroups(groups) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('groups', 'readwrite');
    const store = tx.objectStore('groups');
    store.clear();
    groups.forEach(g => store.put(g));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedGroups() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('groups', 'readonly');
    const store = tx.objectStore('groups');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

// ==========================
// OFFLINE SYNC QUEUE
// ==========================
export async function addToSyncQueue(action) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const req = store.add({
      ...action,
      queued_at: new Date().toISOString()
    });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function getSyncQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readonly');
    const store = tx.objectStore('sync_queue');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeSyncQueueItem(queueId) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const req = store.delete(queueId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearSyncQueue() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('sync_queue', 'readwrite');
    const store = tx.objectStore('sync_queue');
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
