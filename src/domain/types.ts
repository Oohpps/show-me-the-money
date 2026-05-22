export type CategoryId = string;

export interface AssetCategory {
  id: CategoryId;
  name: string;
  shortName: string;
  icon: string;
  isNegative: boolean;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: string;
  name: string;
  category: CategoryId;
  balance: number;
  includeInTotal: boolean;
  note: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SnapshotCategory {
  id: CategoryId;
  name: string;
  isNegative: boolean;
}

export interface DailySnapshot {
  date: string;
  totalAsset: number;
  categoryTotals: Record<CategoryId, number>;
  accountBalances: Record<string, number>;
  categories: SnapshotCategory[];
  deductNegativeAssets: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: 'CNY';
  hideAmounts: boolean;
  deductNegativeAssets: boolean;
  lastBackupAt: string | null;
  appVersion: string;
}

export interface BackupPayload {
  schemaVersion: 2;
  exportedAt: string;
  categories: AssetCategory[];
  accounts: Account[];
  snapshots: DailySnapshot[];
  settings: AppSettings;
}
