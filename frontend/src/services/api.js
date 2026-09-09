import {
  cacheTransactions,
  getCachedTransactions,
  cacheGroups,
  getCachedGroups,
  addToSyncQueue,
  getSyncQueue,
  removeSyncQueueItem
} from '../db/indexdb';
import { generateTimestampId } from '../utils/formatters';

const API_BASE = '/api';

export const api = {
  // Fetch initial data (Online with IndexedDB cache fallback)
  async getData() {
    try {
      const response = await fetch(`${API_BASE}/data`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }
      const data = await response.json();

      // Update IndexedDB cache
      if (data.transactions) {
        await cacheTransactions(data.transactions);
      }
      if (data.all_groups || data.groups) {
        await cacheGroups(data.all_groups || data.groups);
      }

      return {
        transactions: data.transactions || [],
        groups: data.groups || [],
        all_groups: data.all_groups || data.groups || [],
        categories: data.categories || [],
        storage_mode: data.storage_mode || 'google_sheets',
        isOffline: false
      };
    } catch (err) {
      console.warn('[API] Fetch failed, falling back to local:', err.message);
      const [cachedTx, cachedGrp] = await Promise.all([
        getCachedTransactions(),
        getCachedGroups()
      ]);
      return {
        transactions: cachedTx,
        groups: cachedGrp.filter(g => g.status === 'active'),
        all_groups: cachedGrp,
        categories: [],
        storage_mode: 'local_fallback',
        isOffline: true
      };
    }
  },

  // Create Transaction
  async createTransaction(txData) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(txData)
        });
        if (response.ok) {
          const resData = await response.json();
          return { success: true, transaction: resData.transaction, synced: true };
        }
      } catch (err) {
        console.warn('[API] POST failed, queueing offline:', err.message);
      }
    }

    // Offline fallback
    const offlineTx = {
      ...txData,
      id: txData.id || generateTimestampId(),
      created_at: new Date().toISOString(),
      is_deleted: false,
      _is_pending_sync: true
    };

    // Update local cache
    const currentCached = await getCachedTransactions();
    await cacheTransactions([offlineTx, ...currentCached]);

    // Queue for sync
    await addToSyncQueue({
      type: 'CREATE_TRANSACTION',
      payload: offlineTx
    });

    return { success: true, transaction: offlineTx, synced: false };
  },

  // Update Transaction
  async updateTransaction(id, updates) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        });
        if (response.ok) {
          const resData = await response.json();
          return { success: true, transaction: resData.transaction, synced: true };
        }
      } catch (err) {
        console.warn('[API] PUT failed, queueing offline:', err.message);
      }
    }

    // Offline update in IndexedDB
    const cached = await getCachedTransactions();
    const updatedList = cached.map(t => t.id === id ? { ...t, ...updates, _is_pending_sync: true } : t);
    await cacheTransactions(updatedList);

    await addToSyncQueue({
      type: 'UPDATE_TRANSACTION',
      transactionId: id,
      payload: updates
    });

    return { success: true, transaction: { id, ...updates }, synced: false };
  },

  // Delete Transaction
  async deleteTransaction(id) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/transactions/${id}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          return { success: true, synced: true };
        }
      } catch (err) {
        console.warn('[API] DELETE failed, queueing offline:', err.message);
      }
    }

    // Offline soft delete in IndexedDB
    const cached = await getCachedTransactions();
    const updatedList = cached.filter(t => t.id !== id);
    await cacheTransactions(updatedList);

    await addToSyncQueue({
      type: 'DELETE_TRANSACTION',
      transactionId: id
    });

    return { success: true, synced: false };
  },

  // Create Group
  async createGroup(groupName) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/groups`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_name: groupName })
        });
        if (response.ok) {
          const resData = await response.json();
          return { success: true, group: resData.group, synced: true };
        }
      } catch (err) {
        console.warn('[API] Group POST failed, queueing offline:', err.message);
      }
    }

    // Offline group creation
    const offlineGroup = {
      group_id: `grp_local_${Date.now()}`,
      group_name: groupName,
      status: 'active',
      created_at: new Date().toISOString(),
      _is_pending_sync: true
    };

    const cached = await getCachedGroups();
    await cacheGroups([...cached, offlineGroup]);

    await addToSyncQueue({
      type: 'CREATE_GROUP',
      payload: { group_name: groupName, group_id: offlineGroup.group_id }
    });

    return { success: true, group: offlineGroup, synced: false };
  },

  // Archive Group
  async archiveGroup(groupId) {
    const isOnline = navigator.onLine;

    if (isOnline) {
      try {
        const response = await fetch(`${API_BASE}/groups/${groupId}/archive`, {
          method: 'PUT'
        });
        if (response.ok) {
          return { success: true, synced: true };
        }
      } catch (err) {
        console.warn('[API] Group archive failed, queueing offline:', err.message);
      }
    }

    const cached = await getCachedGroups();
    const updated = cached.map(g => g.group_id === groupId ? { ...g, status: 'archived' } : g);
    await cacheGroups(updated);

    await addToSyncQueue({
      type: 'ARCHIVE_GROUP',
      groupId
    });

    return { success: true, synced: false };
  },

  // Create Category
  async createCategory(catData) {
    try {
      const response = await fetch(`${API_BASE}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catData)
      });
      if (response.ok) {
        const resData = await response.json();
        return { success: true, category: resData.category };
      }
      const err = await response.json();
      throw new Error(err.detail || err.error || 'Failed to create category');
    } catch (err) {
      console.error('[API] createCategory error:', err);
      throw err;
    }
  },

  // Sync Queue Runner
  async syncPendingChanges(onProgress) {
    const queue = await getSyncQueue();
    if (!queue || queue.length === 0) return { processed: 0, errors: 0 };

    let processed = 0;
    let errors = 0;

    for (const item of queue) {
      try {
        if (item.type === 'CREATE_TRANSACTION') {
          // Remove local-only temp fields before sending
          const payload = { ...item.payload };
          delete payload._is_pending_sync;
          const res = await fetch(`${API_BASE}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            await removeSyncQueueItem(item.queue_id);
            processed++;
          } else {
            errors++;
          }
        } else if (item.type === 'UPDATE_TRANSACTION') {
          const res = await fetch(`${API_BASE}/transactions/${item.transactionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item.payload)
          });
          if (res.ok) {
            await removeSyncQueueItem(item.queue_id);
            processed++;
          } else {
            errors++;
          }
        } else if (item.type === 'DELETE_TRANSACTION') {
          const res = await fetch(`${API_BASE}/transactions/${item.transactionId}`, {
            method: 'DELETE'
          });
          if (res.ok) {
            await removeSyncQueueItem(item.queue_id);
            processed++;
          } else {
            errors++;
          }
        } else if (item.type === 'CREATE_GROUP') {
          const res = await fetch(`${API_BASE}/groups`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ group_name: item.payload.group_name })
          });
          if (res.ok) {
            await removeSyncQueueItem(item.queue_id);
            processed++;
          } else {
            errors++;
          }
        } else if (item.type === 'ARCHIVE_GROUP') {
          const res = await fetch(`${API_BASE}/groups/${item.groupId}/archive`, {
            method: 'PUT'
          });
          if (res.ok) {
            await removeSyncQueueItem(item.queue_id);
            processed++;
          } else {
            errors++;
          }
        }
      } catch (e) {
        errors++;
        console.error('[API Sync] Failed item sync:', e);
      }

      if (onProgress) {
        onProgress(processed, queue.length);
      }
    }

    return { processed, errors };
  }
};
