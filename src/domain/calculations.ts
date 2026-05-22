import type { Account, AssetCategory, CategoryId, DailySnapshot } from './types';

export const sortCategories = (categories: AssetCategory[]): AssetCategory[] =>
  [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

export const emptyCategoryTotals = (categories: AssetCategory[]): Record<CategoryId, number> =>
  categories.reduce(
    (totals, category) => ({
      ...totals,
      [category.id]: 0,
    }),
    {} as Record<CategoryId, number>,
  );

export const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const normalizeAmountForTotal = (
  amount: number,
  category: AssetCategory | undefined,
  deductNegativeAssets: boolean,
): number => {
  if (!category?.isNegative) {
    return amount;
  }

  if (!deductNegativeAssets) {
    return 0;
  }

  return -Math.abs(amount);
};

const shouldIncludeAccountInTotal = (
  account: Account,
  category: AssetCategory | undefined,
): category is AssetCategory => account.includeInTotal && Boolean(category?.active);

export const calculateTotalAsset = (
  accounts: Account[],
  categories: AssetCategory[],
  deductNegativeAssets: boolean,
): number => {
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  return roundMoney(
    accounts
      .filter((account) => shouldIncludeAccountInTotal(account, categoryMap.get(account.category)))
      .reduce(
        (total, account) =>
          total + normalizeAmountForTotal(account.balance, categoryMap.get(account.category), deductNegativeAssets),
        0,
      ),
  );
};

export const calculateCategoryTotals = (
  accounts: Account[],
  categories: AssetCategory[],
  deductNegativeAssets: boolean,
): Record<CategoryId, number> => {
  const totals = emptyCategoryTotals(categories);
  const categoryMap = new Map(categories.map((category) => [category.id, category]));

  for (const account of accounts) {
    const category = categoryMap.get(account.category);
    if (shouldIncludeAccountInTotal(account, category) && account.category in totals) {
      totals[account.category] = roundMoney(
        totals[account.category] +
          normalizeAmountForTotal(account.balance, category, deductNegativeAssets),
      );
    }
  }

  return totals;
};

export const buildDailySnapshot = (
  accounts: Account[],
  categories: AssetCategory[],
  deductNegativeAssets: boolean,
  date: string,
  timestamp: string,
): DailySnapshot => ({
  date,
  totalAsset: calculateTotalAsset(accounts, categories, deductNegativeAssets),
  categoryTotals: calculateCategoryTotals(accounts, categories, deductNegativeAssets),
  accountBalances: accounts.reduce<Record<string, number>>((balances, account) => {
    const category = categories.find((item) => item.id === account.category);
    if (shouldIncludeAccountInTotal(account, category)) {
      balances[account.id] = account.balance;
    }
    return balances;
  }, {}),
  categories: sortCategories(categories).map((category) => ({
    id: category.id,
    name: category.name,
    isNegative: category.isNegative,
  })),
  deductNegativeAssets,
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

export const getSnapshotChange = (snapshots: DailySnapshot[]): number => {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length < 2) {
    return 0;
  }

  return roundMoney(sorted[sorted.length - 1].totalAsset - sorted[sorted.length - 2].totalAsset);
};

export const getVisibleTrendSnapshots = <T extends { date: string }>(
  snapshots: T[],
  windowSize: number,
): T[] => {
  const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.slice(Math.max(0, sorted.length - Math.max(1, windowSize)));
};

export const parseAmount = (value: string): number | null => {
  const normalized = value.trim().replace(/,/g, '');
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? roundMoney(parsed) : null;
};
