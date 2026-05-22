export type CategoryId =
  | 'bank'
  | 'payment'
  | 'wealth'
  | 'fund'
  | 'stock'
  | 'liability';

export interface CategoryDefinition {
  id: CategoryId;
  label: string;
  shortLabel: string;
  icon: string;
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

export interface DailySnapshot {
  date: string;
  totalAsset: number;
  categoryTotals: Record<CategoryId, number>;
  accountBalances: Record<string, number>;
  createdAt: string;
  updatedAt: string;
}

export interface AppSettings {
  currency: 'CNY';
  hideAmounts: boolean;
  lastBackupAt: string | null;
  appVersion: string;
}

export interface BackupPayload {
  schemaVersion: 1;
  exportedAt: string;
  accounts: Account[];
  snapshots: DailySnapshot[];
  settings: AppSettings;
}

export type TrendRange = 'day' | 'week' | 'month';
