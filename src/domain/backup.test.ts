import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS, SEED_ACCOUNTS } from './categories';
import { buildDailySnapshot } from './calculations';
import { createBackupJson, parseBackupJson } from './backup';

describe('backup import and export', () => {
  it('creates a schema-versioned JSON backup', () => {
    const snapshot = buildDailySnapshot(SEED_ACCOUNTS.slice(0, 2), '2026-05-21', '2026-05-21T08:00:00.000Z');

    const json = createBackupJson({
      accounts: SEED_ACCOUNTS.slice(0, 2),
      snapshots: [snapshot],
      settings: DEFAULT_SETTINGS,
      exportedAt: '2026-05-21T10:00:00.000Z',
    });
    const parsed = JSON.parse(json);

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.exportedAt).toBe('2026-05-21T10:00:00.000Z');
    expect(parsed.accounts).toHaveLength(2);
    expect(parsed.snapshots).toHaveLength(1);
    expect(parsed.settings.currency).toBe('CNY');
  });

  it('parses a valid backup payload', () => {
    const json = createBackupJson({
      accounts: SEED_ACCOUNTS.slice(0, 1),
      snapshots: [],
      settings: DEFAULT_SETTINGS,
      exportedAt: '2026-05-21T10:00:00.000Z',
    });

    const parsed = parseBackupJson(json);

    expect(parsed.ok).toBe(true);
    expect(parsed.ok && parsed.data.accounts[0].name).toBe('招商银行');
  });

  it('rejects invalid JSON without throwing', () => {
    const parsed = parseBackupJson('{broken');

    expect(parsed).toEqual({
      ok: false,
      error: '备份文件不是有效的 JSON。',
    });
  });

  it('rejects unsupported schema versions', () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        schemaVersion: 99,
        exportedAt: '2026-05-21T10:00:00.000Z',
        accounts: [],
        snapshots: [],
        settings: DEFAULT_SETTINGS,
      }),
    );

    expect(parsed).toEqual({
      ok: false,
      error: '备份版本不受支持。',
    });
  });

  it('rejects payloads missing required collections', () => {
    const parsed = parseBackupJson(
      JSON.stringify({
        schemaVersion: 1,
        exportedAt: '2026-05-21T10:00:00.000Z',
        accounts: [],
      }),
    );

    expect(parsed).toEqual({
      ok: false,
      error: '备份文件缺少必要数据。',
    });
  });
});
