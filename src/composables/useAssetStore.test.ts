import { beforeEach, describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SEED_ACCOUNTS } from '../domain/categories';
import { createBackupJson } from '../domain/backup';
import { MemoryAssetRepository } from '../storage/db';
import { createAssetStore } from './useAssetStore';

describe('asset store', () => {
  let repository: MemoryAssetRepository;

  beforeEach(() => {
    repository = new MemoryAssetRepository();
  });

  it('loads seeded accounts when storage is empty', async () => {
    const store = createAssetStore(repository);

    await store.load();

    expect(store.state.accounts.length).toBe(SEED_ACCOUNTS.length);
    expect(store.totalAsset.value).toBe(859355.75);
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
    expect(store.state.accounts.length).toBe(SEED_ACCOUNTS.length);
    expect(store.state.statusMessage).toBe('本地存储暂不可用，已载入示例数据');
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

  it('saves balances and upserts today snapshot', async () => {
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
    expect(store.state.accounts.find((account) => account.id === 'alipay')?.balance).toBe(2500);
  });

  it('toggles hidden amount setting', async () => {
    const store = createAssetStore(repository);
    await store.load();

    await store.setHideAmounts(true);

    expect(store.state.settings.hideAmounts).toBe(true);
    expect((await repository.read()).settings.hideAmounts).toBe(true);
  });

  it('exports and imports backup JSON', async () => {
    const store = createAssetStore(repository);
    await store.load();
    const backup = await store.exportBackup('2026-05-21T10:00:00.000Z');

    const nextStore = createAssetStore(new MemoryAssetRepository());
    await nextStore.importBackup(backup);

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

    expect(store.state.accounts).toHaveLength(0);
    expect(store.state.snapshots).toHaveLength(0);
    expect(store.state.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('imports a valid backup into repository', async () => {
    const store = createAssetStore(repository);
    const backup = createBackupJson({
      accounts: SEED_ACCOUNTS.slice(0, 1),
      snapshots: [],
      settings: DEFAULT_SETTINGS,
      exportedAt: '2026-05-21T10:00:00.000Z',
    });

    const result = await store.importBackup(backup);

    expect(result.ok).toBe(true);
    expect((await repository.read()).accounts).toHaveLength(1);
  });
});
