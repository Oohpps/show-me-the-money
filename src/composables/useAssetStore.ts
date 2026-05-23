import { computed, reactive } from 'vue';
import { createBackupJson, parseBackupJson } from '../domain/backup';
import {
  buildDailySnapshot,
  calculateCategoryDisplayTotals,
  calculateCategoryTotals,
  calculateTotalAsset,
  getDateKey,
  sortCategories,
  upsertSnapshot,
} from '../domain/calculations';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS } from '../domain/categories';
import type { Account, AppSettings, AssetCategory, CategoryId, DailySnapshot, ThemeId } from '../domain/types';
import {
  createSeededData,
  IndexedDbAssetRepository,
  MemoryAssetRepository,
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

interface NewCategoryInput {
  name: string;
  isNegative: boolean;
}

interface AssetState extends AssetData {
  loaded: boolean;
  statusMessage: string;
}

const createInitialState = (): AssetState => ({
  categories: [],
  accounts: [],
  snapshots: [],
  settings: { ...DEFAULT_SETTINGS },
  loaded: false,
  statusMessage: '',
});

const sortAccounts = (accounts: Account[]): Account[] =>
  [...accounts].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

const makeId = (name: string, timestamp: number): string => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
    .replace(/^-|-$/g, '');
  return `${normalized || 'item'}-${timestamp}`;
};

const makeShortName = (name: string): string => name.trim().slice(0, 2) || '分类';

const normalizeAccountBalance = (
  balance: number,
  category: AssetCategory | undefined,
): number => (category?.isNegative ? Math.abs(balance) : balance);

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
  let activeRepository = repository;

  const replaceState = (data: AssetData): void => {
    state.categories = sortCategories(data.categories?.length ? data.categories : DEFAULT_CATEGORIES);
    state.accounts = sortAccounts(data.accounts);
    state.snapshots = [...data.snapshots].sort((a, b) => a.date.localeCompare(b.date));
    state.settings = { ...DEFAULT_SETTINGS, ...data.settings };
  };

  const zeroAccountBalances = (accounts: Account[]): Account[] =>
    accounts.map((account) => ({
      ...account,
      balance: 0,
      updatedAt: now().toISOString(),
    }));

  const persist = async (): Promise<void> => {
    const data = {
      categories: state.categories,
      accounts: state.accounts,
      snapshots: state.snapshots,
      settings: state.settings,
    };

    try {
      await activeRepository.write(data);
    } catch {
      activeRepository = new MemoryAssetRepository(data);
      state.statusMessage = '本地存储暂不可用，本次修改仅在当前会话保留';
    }
  };

  const load = async (): Promise<void> => {
    try {
      const data = await withTimeout(activeRepository.read(), 800);
      replaceState(
        data.categories.length === 0 && data.accounts.length === 0 && data.snapshots.length === 0
          ? createSeededData()
          : data,
      );
    } catch {
      const seededData = createSeededData();
      replaceState(seededData);
      activeRepository = new MemoryAssetRepository(seededData);
      state.statusMessage = '本地存储暂不可用，已载入示例数据';
    }
    state.loaded = true;
  };

  const totalAsset = computed(() =>
    calculateTotalAsset(state.accounts, state.categories, state.settings.deductNegativeAssets),
  );
  const categoryTotals = computed(() =>
    calculateCategoryTotals(state.accounts, state.categories, state.settings.deductNegativeAssets),
  );
  const categoryDisplayTotals = computed(() => calculateCategoryDisplayTotals(state.accounts, state.categories));
  const activeCategories = computed(() => state.categories.filter((category) => category.active));
  const homepageCategories = computed(() =>
    state.categories.filter((category) => state.accounts.some((account) => account.category === category.id)),
  );
  const visibleSnapshots = computed<DailySnapshot[]>(() => state.snapshots);

  const addCategory = async (input: NewCategoryInput): Promise<void> => {
    const timestamp = now().toISOString();
    const category: AssetCategory = {
      id: makeId(input.name, now().getTime()),
      name: input.name.trim(),
      shortName: makeShortName(input.name),
      icon: input.isNegative ? 'debt' : 'asset',
      isNegative: input.isNegative,
      active: true,
      sortOrder: state.categories.length
        ? Math.max(...state.categories.map((item) => item.sortOrder)) + 10
        : 10,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    state.categories = sortCategories([...state.categories, category]);
    state.statusMessage = '分类已添加';
    await persist();
  };

  const updateCategory = async (
    categoryId: CategoryId,
    patch: Partial<Pick<AssetCategory, 'name' | 'isNegative' | 'active'>>,
  ): Promise<void> => {
    const timestamp = now().toISOString();
    state.categories = sortCategories(
      state.categories.map((category) =>
        category.id === categoryId
          ? {
              ...category,
              ...patch,
              shortName: patch.name ? makeShortName(patch.name) : category.shortName,
              updatedAt: timestamp,
            }
          : category,
      ),
    );
    state.statusMessage = '分类已更新';
    await persist();
  };

  const deactivateCategory = async (categoryId: CategoryId): Promise<void> => {
    await updateCategory(categoryId, { active: false });
  };

  const addAccount = async (input: NewAccountInput): Promise<void> => {
    const timestamp = now().toISOString();
    const category = state.categories.find((item) => item.id === input.category);
    const account: Account = {
      id: makeId(input.name, now().getTime()),
      name: input.name.trim(),
      category: input.category,
      balance: normalizeAccountBalance(input.balance, category),
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

  const updateAccount = async (
    accountId: string,
    patch: Partial<Pick<Account, 'name' | 'category' | 'includeInTotal' | 'note' | 'sortOrder'>>,
  ): Promise<void> => {
    const timestamp = now().toISOString();
    state.accounts = sortAccounts(
      state.accounts.map((account) =>
        account.id === accountId
          ? {
              ...account,
              ...patch,
              updatedAt: timestamp,
            }
          : account,
      ),
    );
    state.statusMessage = '平台已更新';
    await persist();
  };

  const deleteAccount = async (accountId: string): Promise<void> => {
    state.accounts = state.accounts.filter((account) => account.id !== accountId);
    state.statusMessage = '平台已删除';
    await persist();
  };

  const deleteCategory = async (categoryId: CategoryId): Promise<void> => {
    state.categories = state.categories.filter((c) => c.id !== categoryId);
    state.accounts = state.accounts.filter((a) => a.category !== categoryId);
    state.statusMessage = '分类已删除';
    await persist();
  };

  const saveBalances = async (balances: Record<string, number>, date = getDateKey(now())): Promise<void> => {
    const timestamp = now().toISOString();
    state.accounts = state.accounts.map((account) =>
      Object.prototype.hasOwnProperty.call(balances, account.id)
        ? {
            ...account,
            balance: normalizeAccountBalance(
              balances[account.id],
              state.categories.find((category) => category.id === account.category),
            ),
            updatedAt: timestamp,
          }
        : account,
    );
    const snapshot = buildDailySnapshot(
      state.accounts,
      state.categories,
      state.settings.deductNegativeAssets,
      date,
      timestamp,
    );
    state.snapshots = upsertSnapshot(state.snapshots, snapshot);
    state.statusMessage = '余额已保存';
    await persist();
  };

  const setHideAmounts = async (hideAmounts: boolean): Promise<void> => {
    state.settings = { ...state.settings, hideAmounts };
    await persist();
  };

  const setDeductNegativeAssets = async (deductNegativeAssets: boolean): Promise<void> => {
    state.settings = { ...state.settings, deductNegativeAssets };
    state.statusMessage = deductNegativeAssets ? '已扣除负资产' : '已忽略负资产';
    await persist();
  };

  const setTheme = async (themeId: ThemeId): Promise<void> => {
    state.settings = { ...state.settings, themeId };
    state.statusMessage = '配色已切换';
    await persist();
  };

  const exportBackup = async (exportedAt = now().toISOString()): Promise<string> => {
    const settings: AppSettings = { ...state.settings, lastBackupAt: exportedAt };
    state.settings = settings;
    await persist();
    return createBackupJson({
      categories: state.categories,
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
      categories: parsed.data.categories,
      accounts: parsed.data.accounts,
      snapshots: parsed.data.snapshots,
      settings: {
        ...DEFAULT_SETTINGS,
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
    replaceState(createSeededData());
    state.settings = { ...DEFAULT_SETTINGS };
    state.statusMessage = '数据及结构已清空';
    await persist();
  };

  const clearDataOnly = async (): Promise<void> => {
    state.accounts = sortAccounts(zeroAccountBalances(state.accounts));
    state.snapshots = [];
    state.statusMessage = '数据已清空';
    await persist();
  };

  return {
    state,
    totalAsset,
    categoryTotals,
    categoryDisplayTotals,
    activeCategories,
    homepageCategories,
    visibleSnapshots,
    load,
    addCategory,
    updateCategory,
    deactivateCategory,
    deleteCategory,
    addAccount,
    updateAccount,
    deleteAccount,
    saveBalances,
    setHideAmounts,
    setDeductNegativeAssets,
    setTheme,
    exportBackup,
    importBackup,
    clearAll,
    clearDataOnly,
  };
};

export type AssetStore = ReturnType<typeof createAssetStore>;

let singletonStore: AssetStore | null = null;

export const useAssetStore = (): AssetStore => {
  singletonStore ??= createAssetStore();
  return singletonStore;
};
