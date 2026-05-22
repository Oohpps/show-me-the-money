import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, SEED_ACCOUNTS } from '../domain/categories';
import type { Account, AppSettings, AssetCategory, DailySnapshot } from '../domain/types';

export interface AssetData {
  categories: AssetCategory[];
  accounts: Account[];
  snapshots: DailySnapshot[];
  settings: AppSettings;
}

export interface AssetRepository {
  read(): Promise<AssetData>;
  write(data: AssetData): Promise<void>;
  clear(): Promise<void>;
}

export const createEmptyData = (): AssetData => ({
  categories: [],
  accounts: [],
  snapshots: [],
  settings: { ...DEFAULT_SETTINGS },
});

const cloneData = (data: AssetData): AssetData => ({
  categories: (data.categories ?? []).map((category) => ({ ...category })),
  accounts: data.accounts.map((account) => ({ ...account })),
  snapshots: data.snapshots.map((snapshot) => ({
    ...snapshot,
    categoryTotals: { ...snapshot.categoryTotals },
    accountBalances: { ...snapshot.accountBalances },
    categories: (snapshot.categories ?? []).map((category) => ({ ...category })),
    deductNegativeAssets: snapshot.deductNegativeAssets ?? true,
  })),
  settings: { ...DEFAULT_SETTINGS, ...data.settings },
});

export class MemoryAssetRepository implements AssetRepository {
  private data: AssetData;

  constructor(initialData: AssetData = createEmptyData()) {
    this.data = cloneData(initialData);
  }

  async read(): Promise<AssetData> {
    return cloneData(this.data);
  }

  async write(data: AssetData): Promise<void> {
    this.data = cloneData(data);
  }

  async clear(): Promise<void> {
    this.data = createEmptyData();
  }
}

const DB_NAME = 'show-me-the-money';
const DB_VERSION = 1;
const STORE_NAME = 'asset-data';
const DATA_KEY = 'current';

export class IndexedDbAssetRepository implements AssetRepository {
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async read(): Promise<AssetData> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DATA_KEY);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const data = request.result as AssetData | undefined;
        resolve(data ? cloneData(data) : createEmptyData());
      };
      transaction.oncomplete = () => db.close();
    });
  }

  async write(data: AssetData): Promise<void> {
    const db = await this.openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cloneData(data), DATA_KEY);

      request.onerror = () => reject(request.error);
      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
    });
  }

  async clear(): Promise<void> {
    await this.write(createEmptyData());
  }
}

export const createSeededData = (): AssetData => ({
  categories: DEFAULT_CATEGORIES.map((category) => ({ ...category })),
  accounts: SEED_ACCOUNTS.map((account) => ({ ...account, balance: 0 })),
  snapshots: [],
  settings: { ...DEFAULT_SETTINGS },
});
