/** Local-only soundtrack storage. IndexedDB is used instead of localStorage for large audio blobs. */
interface StoredTrack { blob: Blob; name: string }
const databaseName = "invito-media-v1";
const storeName = "soundtracks";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") { reject(new Error("IndexedDB unavailable")); return; }
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(storeName)) request.result.createObjectStore(storeName); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Database unavailable"));
  });
}

export async function readLocalAudio(key: string): Promise<StoredTrack | null> {
  const db = await openDatabase();
  try {
    return await new Promise<StoredTrack | null>((resolve, reject) => {
      const request = db.transaction(storeName, "readonly").objectStore(storeName).get(key);
      request.onsuccess = () => resolve((request.result as StoredTrack | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function saveLocalAudio(key: string, track: StoredTrack): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).put(track, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}

export async function deleteLocalAudio(key: string): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(storeName, "readwrite").objectStore(storeName).delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } finally { db.close(); }
}
