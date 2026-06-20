// Minimal IndexedDB blob cache for map tiles (Service Workers are unsupported on
// the glasses; this gives offline reuse of recently/pre-fetched tiles). No deps.

const DB_NAME = "rotortrack";
const STORE = "tiles";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

let dbp: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const d = req.result;
      if (!d.objectStoreNames.contains(STORE)) d.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbp;
}

interface TileRecord {
  blob: Blob;
  t: number;
}

export async function getTile(url: string): Promise<Blob | null> {
  try {
    const d = await db();
    return await new Promise((resolve) => {
      const tx = d.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(url);
      req.onsuccess = () => {
        const rec = req.result as TileRecord | undefined;
        if (rec && Date.now() - rec.t < MAX_AGE_MS) resolve(rec.blob);
        else resolve(null);
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function putTile(url: string, blob: Blob): Promise<void> {
  try {
    const d = await db();
    await new Promise<void>((resolve) => {
      const tx = d.transaction(STORE, "readwrite");
      tx.objectStore(STORE).put({ blob, t: Date.now() } satisfies TileRecord, url);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    /* ignore quota / private-mode errors */
  }
}

export async function tileCount(): Promise<number> {
  try {
    const d = await db();
    return await new Promise((resolve) => {
      const tx = d.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(0);
    });
  } catch {
    return 0;
  }
}
