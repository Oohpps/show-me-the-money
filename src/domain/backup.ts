import type { Account, AppSettings, AssetCategory, BackupPayload, DailySnapshot } from './types';

export type BackupParseResult =
  | { ok: true; data: BackupPayload }
  | { ok: false; error: string };

interface CreateBackupInput {
  categories: AssetCategory[];
  accounts: Account[];
  snapshots: DailySnapshot[];
  settings: AppSettings;
  exportedAt: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const createBackupJson = ({
  categories,
  accounts,
  snapshots,
  settings,
  exportedAt,
}: CreateBackupInput): string =>
  JSON.stringify(
    {
      schemaVersion: 2,
      exportedAt,
      categories,
      accounts,
      snapshots,
      settings,
    } satisfies BackupPayload,
    null,
    2,
  );

export const parseBackupJson = (json: string): BackupParseResult => {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    return { ok: false, error: '备份文件不是有效的 JSON。' };
  }

  if (!isRecord(raw)) {
    return { ok: false, error: '备份文件缺少必要数据。' };
  }

  if (raw.schemaVersion !== 2) {
    return { ok: false, error: '备份版本不受支持。' };
  }

  if (
    typeof raw.exportedAt !== 'string' ||
    !Array.isArray(raw.categories) ||
    !Array.isArray(raw.accounts) ||
    !Array.isArray(raw.snapshots) ||
    !isRecord(raw.settings)
  ) {
    return { ok: false, error: '备份文件缺少必要数据。' };
  }

  return {
    ok: true,
    data: {
      schemaVersion: 2,
      exportedAt: raw.exportedAt,
      categories: raw.categories as AssetCategory[],
      accounts: raw.accounts as Account[],
      snapshots: raw.snapshots as DailySnapshot[],
      settings: raw.settings as unknown as AppSettings,
    },
  };
};
