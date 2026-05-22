import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES } from './categories';
import type { Account, AssetCategory, DailySnapshot } from './types';
import {
  buildDailySnapshot,
  calculateCategoryTotals,
  calculateTotalAsset,
  formatMoney,
  getSnapshotChange,
  getVisibleTrendSnapshots,
  upsertSnapshot,
} from './calculations';

const categories: AssetCategory[] = DEFAULT_CATEGORIES;

const baseAccount = (account: Partial<Account>): Account => ({
  id: account.id ?? 'account',
  name: account.name ?? '账户',
  category: account.category ?? 'bank',
  balance: account.balance ?? 0,
  includeInTotal: account.includeInTotal ?? true,
  note: account.note ?? '',
  sortOrder: account.sortOrder ?? 1,
  createdAt: account.createdAt ?? '2026-05-21T00:00:00.000Z',
  updatedAt: account.updatedAt ?? '2026-05-21T00:00:00.000Z',
});

describe('asset calculations', () => {
  it('subtracts negative categories when the setting is enabled', () => {
    const accounts = [
      baseAccount({ id: 'bank', balance: 1000 }),
      baseAccount({ id: 'ignored', balance: 5000, includeInTotal: false }),
      baseAccount({ id: 'card', category: 'liability', balance: 300 }),
    ];

    expect(calculateTotalAsset(accounts, categories, true)).toBe(700);
  });

  it('ignores negative categories when deduct negative assets is disabled', () => {
    const accounts = [
      baseAccount({ id: 'bank', balance: 1000 }),
      baseAccount({ id: 'card', category: 'liability', balance: 300 }),
    ];

    expect(calculateTotalAsset(accounts, categories, false)).toBe(1000);
  });

  it('groups category totals with dynamic categories', () => {
    const accounts = [
      baseAccount({ id: 'bank-a', category: 'bank', balance: 1000 }),
      baseAccount({ id: 'bank-b', category: 'bank', balance: 200 }),
      baseAccount({ id: 'alipay', category: 'payment', balance: 88.5 }),
      baseAccount({ id: 'card', category: 'liability', balance: 30 }),
      baseAccount({ id: 'hidden', category: 'cash', balance: 900, includeInTotal: false }),
    ];

    expect(calculateCategoryTotals(accounts, categories, true)).toMatchObject({
      bank: 1200,
      payment: 88.5,
      cash: 0,
      liability: -30,
    });
  });

  it('excludes inactive categories from totals', () => {
    const inactiveCategories = categories.map((category) =>
      category.id === 'payment' ? { ...category, active: false } : category,
    );
    const accounts = [
      baseAccount({ id: 'bank', category: 'bank', balance: 1000 }),
      baseAccount({ id: 'alipay', category: 'payment', balance: 500 }),
    ];

    expect(calculateTotalAsset(accounts, inactiveCategories, true)).toBe(1000);
    expect(calculateCategoryTotals(accounts, inactiveCategories, true).payment).toBe(0);
  });

  it('builds one daily snapshot with category metadata and settings', () => {
    const accounts = [
      baseAccount({ id: 'bank', category: 'bank', balance: 1000 }),
      baseAccount({ id: 'alipay', category: 'payment', balance: 300.12 }),
    ];

    const snapshot = buildDailySnapshot(
      accounts,
      categories,
      true,
      '2026-05-21',
      '2026-05-21T09:00:00.000Z',
    );

    expect(snapshot).toMatchObject({
      date: '2026-05-21',
      totalAsset: 1300.12,
      deductNegativeAssets: true,
      accountBalances: {
        bank: 1000,
        alipay: 300.12,
      },
    });
    expect(snapshot.categories.find((category) => category.id === 'liability')).toMatchObject({
      name: '负债',
      isNegative: true,
    });
  });

  it('replaces an existing snapshot for the same date', () => {
    const oldSnapshot: DailySnapshot = buildDailySnapshot(
      [baseAccount({ id: 'bank', balance: 500 })],
      categories,
      true,
      '2026-05-21',
      '2026-05-21T08:00:00.000Z',
    );
    const newSnapshot = buildDailySnapshot(
      [baseAccount({ id: 'bank', balance: 900 })],
      categories,
      true,
      '2026-05-21',
      '2026-05-21T11:00:00.000Z',
    );

    const snapshots = upsertSnapshot([oldSnapshot], newSnapshot);

    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].totalAsset).toBe(900);
    expect(snapshots[0].createdAt).toBe(oldSnapshot.createdAt);
    expect(snapshots[0].updatedAt).toBe('2026-05-21T11:00:00.000Z');
  });

  it('formats hidden and visible money consistently', () => {
    expect(formatMoney(123456.789, false)).toBe('CNY 123,456.79');
    expect(formatMoney(123456.789, true)).toBe('CNY ****');
  });

  it('calculates change between latest two recorded snapshots', () => {
    const first = buildDailySnapshot(
      [baseAccount({ id: 'bank', balance: 1000 })],
      categories,
      true,
      '2026-05-20',
      '2026-05-20T08:00:00.000Z',
    );
    const second = buildDailySnapshot(
      [baseAccount({ id: 'bank', balance: 880 })],
      categories,
      true,
      '2026-05-22',
      '2026-05-22T08:00:00.000Z',
    );

    expect(getSnapshotChange([second, first])).toBe(-120);
    expect(getSnapshotChange([second])).toBe(0);
  });

  it('returns the latest recorded snapshots for a manual zoom window', () => {
    const snapshots = ['2026-05-01', '2026-05-05', '2026-05-12', '2026-05-22'].map((date, index) =>
      buildDailySnapshot(
        [baseAccount({ id: 'bank', balance: 1000 + index })],
        categories,
        true,
        date,
        `${date}T08:00:00.000Z`,
      ),
    );

    expect(getVisibleTrendSnapshots(snapshots, 2).map((snapshot) => snapshot.date)).toEqual([
      '2026-05-12',
      '2026-05-22',
    ]);
    expect(getVisibleTrendSnapshots(snapshots, 20)).toHaveLength(4);
  });
});
