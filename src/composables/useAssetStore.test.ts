import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, SEED_ACCOUNTS } from '../domain/categories';
import { createBackupJson } from '../domain/backup';
import { MemoryAssetRepository } from '../storage/db';
import { createAssetStore } from './useAssetStore';

describe('asset store', () => {
  let repository: MemoryAssetRepository;

  beforeEach(() => {
    repository = new MemoryAssetRepository();
  });

  it('loads seeded categories and accounts when storage is empty', async () => {
    const store = createAssetStore(repository);

    await store.load();

    expect(store.state.categories.length).toBe(DEFAULT_CATEGORIES.length);
    expect(store.state.accounts.length).toBe(SEED_ACCOUNTS.length);
    expect(store.totalAsset.value).toBe(859355.75);
  });

  it('migrates older data that has accounts but no categories', async () => {
    repository = new MemoryAssetRepository({
      categories: [],
      accounts: SEED_ACCOUNTS.slice(0, 1),
      snapshots: [],
      settings: DEFAULT_SETTINGS,
    });
    const store = createAssetStore(repository);

    await store.load();

    expect(store.state.categories.length).toBe(DEFAULT_CATEGORIES.length);
    expect(store.state.accounts).toHaveLength(1);
  });

  it('falls back to seeded accounts when repository read fails', async () => {
    const failingRepository = {
      read: async () => {
        throw new Error('indexeddb unavailable');
      },
      write: async () => undefined,
      clear: async () => undefined,
    };
    const store = createAssetStore(failingRepository);

    await store.load();

    expect(store.state.loaded).toBe(true);
    expect(store.state.categories.length).toBe(DEFAULT_CATEGORIES.length);
    expect(store.state.accounts.length).toBe(SEED_ACCOUNTS.length);
    expect(store.state.statusMessage).toBe('本地存储暂不可用，已载入示例数据');
  });

  it('creates a category and persists it', async () => {
    const store = createAssetStore(repository, () => new Date('2026-05-21T10:00:00.000Z'));
    await store.load();

    await store.addCategory({ name: '借款', isNegative: true });

    expect(store.state.categories.some((category) => category.name === '借款' && category.isNegative)).toBe(true);
    expect((await repository.read()).categories.some((category) => category.name === '借款')).toBe(true);
  });

  it('updates category negative flag and total calculation follows the setting', async () => {
    const store = createAssetStore(repository, () => new Date('2026-05-21T10:00:00.000Z'));
    await store.load();

    await store.addCategory({ name: '贷款', isNegative: true });
    const loanCategory = store.state.categories.find((category) => category.name === '贷款');
    expect(loanCategory).toBeDefined();
    await store.addAccount({
      name: '房贷',
      category: loanCategory!.id,
      balance: 100000,
      includeInTotal: true,
      note: '',
    });

    expect(store.totalAsset.value).toBe(759355.75);
    await store.setDeductNegativeAssets(false);
    expect(store.totalAsset.value).toBe(859355.75);
  });

  it('deactivates a category without deleting accounts', async () => {
    const store = createAssetStore(repository);
    await store.load();

    await store.deactivateCategory('payment');

    expect(store.state.categories.find((category) => category.id === 'payment')?.active).toBe(false);
    expect(store.state.accounts.some((account) => account.category === 'payment')).toBe(true);
  });

  it('creates an account and persists it', async () => {
    const store = createAssetStore(repository);
    await store.load();

    await store.addAccount({
      name: '华泰证券',
      category: 'stock',
      balance: 12000,
      includeInTotal: true,
      note: '新股票账户',
    });

    expect(store.state.accounts.some((account) => account.name === '华泰证券')).toBe(true);
    expect((await repository.read()).accounts.some((account) => account.name === '华泰证券')).toBe(true);
  });

  it('saves balances and upserts today snapshot with category metadata', async () => {
    const store = createAssetStore(repository, () => new Date('2026-05-21T10:00:00.000Z'));
    await store.load();

    await store.saveBalances({
      alipay: 2000,
      wechat: 300,
    });
    await store.saveBalances({
      alipay: 2500,
      wechat: 300,
    });

    expect(store.state.snapshots).toHaveLength(1);
    expect(store.state.snapshots[0].date).toBe('2026-05-21');
    expect(store.state.snapshots[0].categories.find((category) => category.id === 'liability')?.isNegative).toBe(true);
    expect(store.state.accounts.find((account) => account.id === 'alipay')?.balance).toBe(2500);
  });

  it('toggles hidden amount setting', async () => {
    const store = createAssetStore(repository);
    await store.load();

    await store.setHideAmounts(true);

    expect(store.state.settings.hideAmounts).toBe(true);
    expect((await repository.read()).settings.hideAmounts).toBe(true);
  });

  it('persists selected visual theme', async () => {
    const store = createAssetStore(repository);
    await store.load();

    await store.setTheme('ocean');

    expect(store.state.settings.themeId).toBe('ocean');
    expect((await repository.read()).settings.themeId).toBe('ocean');
  });

  it('exports and imports backup JSON', async () => {
    const store = createAssetStore(repository);
    await store.load();
    const backup = await store.exportBackup('2026-05-21T10:00:00.000Z');

    const nextStore = createAssetStore(new MemoryAssetRepository());
    await nextStore.importBackup(backup);

    expect(nextStore.state.categories).toHaveLength(DEFAULT_CATEGORIES.length);
    expect(nextStore.state.accounts).toHaveLength(SEED_ACCOUNTS.length);
    expect(nextStore.state.settings.lastBackupAt).toBe('2026-05-21T10:00:00.000Z');
  });

  it('rejects invalid backup JSON and keeps existing data', async () => {
    const store = createAssetStore(repository);
    await store.load();
    const beforeCount = store.state.accounts.length;

    const result = await store.importBackup('{broken');

    expect(result.ok).toBe(false);
    expect(store.state.accounts).toHaveLength(beforeCount);
  });

  it('clears local data', async () => {
    const store = createAssetStore(repository);
    await store.load();

    await store.clearAll();

    expect(store.state.categories).toHaveLength(0);
    expect(store.state.accounts).toHaveLength(0);
    expect(store.state.snapshots).toHaveLength(0);
    expect(store.state.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('imports a valid backup into repository', async () => {
    const store = createAssetStore(repository);
    const backup = createBackupJson({
      categories: DEFAULT_CATEGORIES.slice(0, 1),
      accounts: SEED_ACCOUNTS.slice(0, 1),
      snapshots: [],
      settings: DEFAULT_SETTINGS,
      exportedAt: '2026-05-21T10:00:00.000Z',
    });

    const result = await store.importBackup(backup);

    expect(result.ok).toBe(true);
    expect((await repository.read()).categories).toHaveLength(1);
    expect((await repository.read()).accounts).toHaveLength(1);
  });
});
