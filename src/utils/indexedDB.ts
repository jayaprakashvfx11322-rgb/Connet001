/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * High-performance, zero-dependency offline IndexedDB caching engine.
 * Fully compatible with standard browsers and Capacitor Android WebViews.
 */

const DB_NAME = 'connectx_offline_store';
const DB_VERSION = 2;

export interface OfflineAction {
  id: string;
  type: 'post_reaction' | 'reel_reaction' | 'video_reaction' | 'post_comment' | 'reel_comment' | 'video_comment' | 'send_message' | 'create_post';
  payload: any;
  createdAt: number;
}

/**
 * Initializes and references the local IndexedDB instance.
 */
export function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Graceful fallback for non-browser runtimes
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported on this platform'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Upgrade safety check or creation
      if (!db.objectStoreNames.contains('social_store')) {
        db.createObjectStore('social_store', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('action_queue')) {
        db.createObjectStore('action_queue', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open database'));
    };
  });
}

/**
 * Saves or updates a cached item (such as an array of posts, reels, or configuration parameters) inside IndexedDB.
 */
export async function setCachedItem<T>(id: string, value: T): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('social_store', 'readwrite');
      const store = transaction.objectStore('social_store');
      
      const record = { id, value, updatedAt: Date.now() };
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to write element to store'));
    });
  } catch (err) {
    console.warn(`[IndexedDB Cache Store] Fail putting key: "${id}".`, err);
  }
}

/**
 * Retrieves a cached item wrapper from IndexedDB.
 */
export async function getCachedItem<T>(id: string): Promise<T | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('social_store', 'readonly');
      const store = transaction.objectStore('social_store');
      const request = store.get(id);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result.value as T);
        } else {
          resolve(null);
        }
      };
      
      request.onerror = () => reject(request.error ?? new Error('Failed to read element from store'));
    });
  } catch (err) {
    console.warn(`[IndexedDB Cache Store] Fail getting key: "${id}".`, err);
    return null;
  }
}

/**
 * Clears the entirety of local IndexedDB cache elements.
 */
export async function clearAllCachedItems(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('social_store', 'readwrite');
      const store = transaction.objectStore('social_store');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to clear cash store'));
    });
  } catch (err) {
    console.warn('[IndexedDB Cache Store] Error clearing stores.', err);
  }
}

/**
 * Enqueues a new offline user action to be synced later.
 */
export async function enqueueOfflineAction(type: OfflineAction['type'], payload: any): Promise<string> {
  const id = `act_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('action_queue', 'readwrite');
      const store = transaction.objectStore('action_queue');
      const action: OfflineAction = {
        id,
        type,
        payload,
        createdAt: Date.now()
      };
      const request = store.put(action);
      request.onsuccess = () => {
        console.log(`[Offline Action Queue] Successfully queued offline action: ${type}`, action);
        resolve(id);
      };
      request.onerror = () => reject(request.error ?? new Error('Failed to enqueue action'));
    });
  } catch (err) {
    console.warn('[Offline Action Queue] Failed to queue offline action:', err);
    return id;
  }
}

/**
 * Retrieves all stored offline user actions sorted by creation timestamp.
 */
export async function getOfflineActions(): Promise<OfflineAction[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('action_queue', 'readonly');
      const store = transaction.objectStore('action_queue');
      const request = store.getAll();
      request.onsuccess = () => {
        const actions = (request.result as OfflineAction[]) || [];
        // Sort actions chronologically
        actions.sort((a, b) => a.createdAt - b.createdAt);
        resolve(actions);
      };
      request.onerror = () => reject(request.error ?? new Error('Failed to retrieve queued actions'));
    });
  } catch (err) {
    console.warn('[Offline Action Queue] Failed to retrieve queue:', err);
    return [];
  }
}

/**
 * Deletes a synced action from the queue.
 */
export async function dequeueOfflineAction(id: string): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('action_queue', 'readwrite');
      const store = transaction.objectStore('action_queue');
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`[Offline Action Queue] Successfully dequeued action ID: ${id}`);
        resolve();
      };
      request.onerror = () => reject(request.error ?? new Error('Failed to delete queued action'));
    });
  } catch (err) {
    console.warn('[Offline Action Queue] Failed to dequeue action:', err);
  }
}

/**
 * Clears the entirety of queued offline actions.
 */
export async function clearOfflineActions(): Promise<void> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('action_queue', 'readwrite');
      const store = transaction.objectStore('action_queue');
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error('Failed to clear action queue'));
    });
  } catch (err) {
    console.warn('[Offline Action Queue] Error clearing action queue:', err);
  }
}
