import { computed, reactive } from 'vue';
import { createBackupJson, parseBackupJson } from '../domain/backup';
import {
  buildDailySnapshot,
  calculateCategoryTotals,
  calculateTotalAsset,
  getDateKey,
  upsertSnapshot,
} from '../domain/calculations';
import { DEFAULT_SETTINGS } from '../domain/categories';
import type { Account, AppSettings, CategoryId, DailySnapshot } from '../domain/types';
import {
  createSeededData,
  IndexedDbAssetRepository,
  type AssetData,
  type AssetRepository,
} from '../storage/db';

interface NewAccountInput {
  name: string;
  category: CategoryId;
  balance: number;
  includeInTotal: boolean;
  note: string;
}

interface AssetState extends AssetData {
  loaded: boolean;
  statusMessage: string;
}

const createInitialState = (): AssetState => ({
  accounts: [],
  snapshots: [],
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,
  statusMessage: '',
});

const sortAccounts = (accounts: Account[]): Account[] =>
  [...accounts].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

const makeId = (name: string, timestamp: number): string =>
  `${name.trim().toLowerCase().replace(/\s+/g, '-') || 'account'}-${timestamp}`;

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error('storage read timeout')), timeoutMs);
    promise
      .then((value) => {
        window.clearTimeout(timeout);
        resolve(value);
      })
      .catch((error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      });
  });

export const createAssetStore = (
  repository: AssetRepository = new IndexedDbAssetRepository(),
  now: () => Date = () => new Date(),
) => {
  const state = reactive<AssetState>(createInitialState());

  const replaceState = (data: AssetData): void => {
    state.accounts = sortAccounts(data.accounts);
    state.snapshots = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date));
    state.settings = { ...data.settings };
  };

  const persist = async (): Promise<void> => {
    await repository.write({
      accounts: state.accounts,
      snapshots: state.snapshots,
      settings: state.settings,
    });
  };

  const load = async (): Promise<void> => {
    try {
      const data = await withTimeout(repository.read(), 800);
      replaceState(data.accounts.length === 0 && data.snapshots.length === 0 ? createSeededData() : data);
    } catch {
      replaceState(createSeededData());
      state.statusMessage = '本地存储暂不可用，已载入示例数据';
    }
    state.loaded = true;
  };

  const totalAsset = computed(() => calculateTotalAsset(state.accounts));
  const categoryTotals = computed(() => calculateCategoryTotals(state.accounts));
  const visibleSnapshots = computed<DailySnapshot[]>(() => state.snapshots);

  const addAccount = async (input: NewAccountInput): Promise<void> => {
    const timestamp = now().toISOString();
    const account: Account = {
      id: makeId(input.name, now().getTime()),
      name: input.name.trim(),
      category: input.category,
      balance: input.balance,
      includeInTotal: input.includeInTotal,
      note: input.note.trim(),
      sortOrder: state.accounts.length ? Math.max(...state.accounts.map((item) => item.sortOrder)) + 10 : 10,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.accounts = sortAccounts([...state.accounts, account]);
    state.statusMessage = '平台已添加';
    await persist();
  };

  const saveBalances = async (balances: Record<string, number>): Promise<void> => {
    const timestamp = now().toISOString();
    state.accounts = state.accounts.map((account) =>
      Object.prototype.hasOwnProperty.call(balances, account.id)
        ? { ...account, balance: balances[account.id], updatedAt: timestamp }
        : account,
    );
    const snapshot = buildDailySnapshot(state.accounts, getDateKey(now()), timestamp);
    state.snapshots = upsertSnapshot(state.snapshots, snapshot);
    state.statusMessage = '余额已保存';
    await persist();
  };

  const setHideAmounts = async (hideAmounts: boolean): Promise<void> => {
    state.settings = { ...state.settings, hideAmounts };
    await persist();
  };

  const exportBackup = async (exportedAt = now().toISOString()): Promise<string> => {
    const settings: AppSettings = { ...state.settings, lastBackupAt: exportedAt };
    state.settings = settings;
    await persist();
    return createBackupJson({
      accounts: state.accounts,
      snapshots: state.snapshots,
      settings,
      exportedAt,
    });
  };

  const importBackup = async (json: string): Promise<{ ok: true } | { ok: false; error: string }> => {
    const parsed = parseBackupJson(json);
    if (!parsed.ok) {
      return parsed;
    }

    const importedData: AssetData = {
      accounts: parsed.data.accounts,
      snapshots: parsed.data.snapshots,
      settings: {
        ...parsed.data.settings,
        currency: 'CNY',
        lastBackupAt: parsed.data.exportedAt,
      },
    };
    replaceState(importedData);
    state.loaded = true;
    state.statusMessage = '备份已导入';
    await persist();
    return { ok: true };
  };

  const clearAll = async (): Promise<void> => {
    await repository.clear();
    replaceState({
      accounts: [],
      snapshots: [],
      settings: { ...DEFAULT_SETTINGS },
    });
    state.statusMessage = '数据已清空';
  };

  return {
    state,
    totalAsset,
    categoryTotals,
    visibleSnapshots,
    load,
    addAccount,
    saveBalances,
    setHideAmounts,
    exportBackup,
    importBackup,
    clearAll,
  };
};

export type AssetStore = ReturnType<typeof createAssetStore>;

let singletonStore: AssetStore | null = null;

export const useAssetStore = (): AssetStore => {
  singletonStore ??= createAssetStore();
  return singletonStore;
};
