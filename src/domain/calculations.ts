import { CATEGORY_IDS } from './categories';
import type { Account, CategoryId, DailySnapshot, TrendRange } from './types';

export const emptyCategoryTotals = (): Record<CategoryId, number> =>
  CATEGORY_IDS.reduce(
    (totals, categoryId) => ({
      ...totals,
      [categoryId]: 0,
    }),
    {} as Record<CategoryId, number>,
  );

export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

export const calculateTotalAsset = (accounts: Account[]): number =>
  roundMoney(
    accounts
      .filter((account) => account.includeInTotal)
      .reduce((total, account) => total + account.balance, 0),
  );

export const calculateCategoryTotals = (accounts: Account[]): Record<CategoryId, number> => {
  const totals = emptyCategoryTotals();

  for (const account of accounts) {
    if (account.includeInTotal) {
      totals[account.category] = roundMoney(totals[account.category] + account.balance);
    }
  }

  return totals;
};

export const buildDailySnapshot = (
  accounts: Account[],
  date: string,
  timestamp: string,
): DailySnapshot => ({
  date,
  totalAsset: calculateTotalAsset(accounts),
  categoryTotals: calculateCategoryTotals(accounts),
  accountBalances: accounts.reduce<Record<string, number>>((balances, account) => {
    if (account.includeInTotal) {
      balances[account.id] = account.balance;
    }
    return balances;
  }, {}),
  createdAt: timestamp,
  updatedAt: timestamp,
});

export const upsertSnapshot = (
  snapshots: DailySnapshot[],
  nextSnapshot: DailySnapshot,
): DailySnapshot[] => {
  const existing = snapshots.find((snapshot) => snapshot.date === nextSnapshot.date);
  const mergedSnapshot = existing
    ? {
        ...nextSnapshot,
        createdAt: existing.createdAt,
        updatedAt: nextSnapshot.updatedAt,
      }
    : nextSnapshot;

  return [
    ...snapshots.filter((snapshot) => snapshot.date !== nextSnapshot.date),
    mergedSnapshot,
  ].sort((a, b) => a.date.localeCompare(b.date));
};

export const formatMoney = (value: number, hidden: boolean): string => {
  if (hidden) {
    return 'CNY ****';
  }

  return `CNY ${roundMoney(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatSignedMoney = (value: number, hidden: boolean): string => {
  if (hidden) {
    return 'CNY ****';
  }

  const sign = value > 0 ? '+' : '';
  return `${sign}${formatMoney(value, false)}`;
};

export const getDateKey = (date = new Date()): string => date.toISOString().slice(0, 10);

export const getChangeForRange = (
  snapshots: DailySnapshot[],
  currentTotal: number,
  range: TrendRange,
): number => {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) {
    return 0;
  }

  const lookback = range === 'day' ? 1 : range === 'week' ? 7 : 30;
  const baselineIndex = Math.max(0, sorted.length - 1 - lookback);
  return roundMoney(currentTotal - sorted[baselineIndex].totalAsset);
};

export const parseAmount = (value: string): number | null => {
  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? roundMoney(parsed) : null;
};
