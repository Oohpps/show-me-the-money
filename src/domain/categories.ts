import type { Account, AppSettings, CategoryDefinition, CategoryId } from './types';

export const APP_VERSION = '0.1.0';

export const CATEGORIES: CategoryDefinition[] = [
  { id: 'bank', label: '银行卡', shortLabel: '银行', icon: 'card' },
  { id: 'payment', label: '支付平台', shortLabel: '支付', icon: 'wallet' },
  { id: 'wealth', label: '理财', shortLabel: '理财', icon: 'bag' },
  { id: 'fund', label: '基金', shortLabel: '基金', icon: 'chart' },
  { id: 'stock', label: '股票', shortLabel: '股票', icon: 'screen' },
  { id: 'liability', label: '信用卡/负债', shortLabel: '负债', icon: 'credit' },
];

export const CATEGORY_IDS = CATEGORIES.map((category) => category.id) as CategoryId[];

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'CNY',
  hideAmounts: false,
  lastBackupAt: null,
  appVersion: APP_VERSION,
};

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'cmb-bank',
    name: '招商银行',
    category: 'bank',
    balance: 63206.32,
    includeInTotal: true,
    note: '工资卡与活期',
    sortOrder: 10,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'alipay',
    name: '支付宝',
    category: 'payment',
    balance: 1970.8,
    includeInTotal: true,
    note: '',
    sortOrder: 20,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'wechat',
    name: '微信',
    category: 'payment',
    balance: 0,
    includeInTotal: true,
    note: '',
    sortOrder: 30,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'funds',
    name: '基金账户',
    category: 'fund',
    balance: 664239.71,
    includeInTotal: true,
    note: '',
    sortOrder: 40,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'stock',
    name: '股票账户',
    category: 'stock',
    balance: 27802.5,
    includeInTotal: true,
    note: '',
    sortOrder: 50,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'wealth',
    name: '银行理财',
    category: 'wealth',
    balance: 102136.42,
    includeInTotal: true,
    note: '',
    sortOrder: 60,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'credit-card',
    name: '信用卡',
    category: 'liability',
    balance: 0,
    includeInTotal: true,
    note: '负数表示欠款',
    sortOrder: 70,
    createdAt: '2026-05-20T08:00:00.000Z',
    updatedAt: '2026-05-20T08:00:00.000Z',
  },
];
