import { describe, expect, it } from 'vitest';
import type { Account, DailySnapshot } from './types';
import {
  buildDailySnapshot,
  calculateCategoryTotals,
  calculateTotalAsset,
  formatMoney,
  getSnapshotChange,
  getVisibleTrendSnapshots,
  upsertSnapshot,
} from './calculations';

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
  it('sums included accounts and subtracts liability balances', () => {
    const accounts = [
      baseAccount({ id: 'bank', balance: 1000 }),
      baseAccount({ id: 'ignored', balance: 5000, includeInTotal: false }),
      baseAccount({ id: 'card', category: 'liability', balance: -300 }),
    ];

    expect(calculateTotalAsset(accounts)).toBe(700);
  });

  it('groups category totals with fixed categories', () => {
    const accounts = [
      baseAccount({ id: 'bank-a', category: 'bank', balance: 1000 }),
      baseAccount({ id: 'bank-b', category: 'bank', balance: 200 }),
      baseAccount({ id: 'alipay', category: 'payment', balance: 88.5 }),
      baseAccount({ id: 'hidden', category: 'fund', balance: 900, includeInTotal: false }),
    ];

    expect(calculateCategoryTotals(accounts)).toMatchObject({
      bank: 1200,
      payment: 88.5,
      fund: 0,
      liability: 0,
    });
  });

  it('builds one daily snapshot from current account balances', () => {
    const accounts = [
      baseAccount({ id: 'bank', category: 'bank', balance: 1000 }),
      baseAccount({ id: 'alipay', category: 'payment', balance: 300.12 }),
    ];

    const snapshot = buildDailySnapshot(accounts, '2026-05-21', '2026-05-21T09:00:00.000Z');

    expect(snapshot).toMatchObject({
      date: '2026-05-21',
      totalAsset: 1300.12,
      accountBalances: {
        bank: 1000,
        alipay: 300.12,
      },
    });
  });

  it('replaces an existing snapshot for the same date', () => {
    const oldSnapshot: DailySnapshot = buildDailySnapshot(
      [baseAccount({ id: 'bank', balance: 500 })],
      '2026-05-21',
      '2026-05-21T08:00:00.000Z',
    );
    const newSnapshot = buildDailySnapshot(
      [baseAccount({ id: 'bank', balance: 900 })],
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
      '2026-05-20',
      '2026-05-20T08:00:00.000Z',
    );
    const second = buildDailySnapshot(
      [baseAccount({ id: 'bank', balance: 880 })],
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
