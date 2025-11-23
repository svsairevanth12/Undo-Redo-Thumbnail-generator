
import { GalleryItem } from '../types';

const DB_NAME = 'UnReDO_DB';
const STORE_NAME = 'gallery';
const DB_VERSION = 1;

/**
 * Open/Create the IndexedDB database
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save or Update a gallery item in the DB
 */
export const saveGalleryItem = async (item: GalleryItem) => {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(item); // .put() handles both insert and update

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save item to DB:", error);
  }
};

/**
 * Retrieve all gallery items from DB, sorted by timestamp (newest first)
 */
export const getGalleryItems = async (): Promise<GalleryItem[]> => {
  try {
    const db = await initDB();
    return new Promise<GalleryItem[]>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result as GalleryItem[];
        // Sort newest first
        items.sort((a, b) => b.timestamp - a.timestamp);
        resolve(items);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to fetch items from DB:", error);
    return [];
  }
};

/**
 * Delete a specific item by ID
 */
export const deleteGalleryItem = async (id: string) => {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete item from DB:", error);
  }
};

/**
 * Clear the entire database (Nuke)
 */
export const clearGalleryDB = async () => {
  try {
    const db = await initDB();
    return new Promise<void>((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to clear DB:", error);
  }
};
