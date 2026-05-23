import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAssetStore } from '../composables/useAssetStore';
import { createBackupJson } from '../domain/backup';
import { DEFAULT_CATEGORIES, DEFAULT_SETTINGS, SEED_ACCOUNTS } from '../domain/categories';
import { MemoryAssetRepository } from '../storage/db';
import SettingsView from './SettingsView.vue';

describe('SettingsView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('opens category management as a secondary page', async () => {
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(SettingsView, { props: { store } });

    await wrapper.get('button.settings-menu-item').trigger('click');

    expect(wrapper.text()).toContain('新增分类');
    expect(wrapper.text()).toContain('标记为负资产');
    expect(wrapper.find('.subpage-layer').exists()).toBe(true);
  });

  it('opens theme settings and switches the selected theme', async () => {
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(SettingsView, { props: { store } });
    const menuItems = wrapper.findAll('button.settings-menu-item');

    await menuItems[1].trigger('click');

    expect(wrapper.text()).toContain('暖纸黄');
    expect(wrapper.text()).toContain('深海蓝');

    const oceanCard = wrapper.findAll('button.theme-card').find((item) => item.text().includes('深海蓝'));
    expect(oceanCard).toBeDefined();
    await oceanCard!.trigger('click');

    expect(store.state.settings.themeId).toBe('ocean');
  });

  it('opens backup and restore as a secondary page', async () => {
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(SettingsView, { props: { store } });

    expect(wrapper.text()).toContain('备份恢复');
    expect(wrapper.text()).not.toContain('导出的 JSON 会显示在这里');

    const backupItem = wrapper
      .findAll('button.settings-menu-item')
      .find((item) => item.text().includes('备份恢复'));
    expect(backupItem).toBeDefined();
    await backupItem!.trigger('click');

    expect(wrapper.text()).toContain('生成 JSON 文本');
    expect(wrapper.text()).toContain('导出文件');
    expect(wrapper.text()).toContain('选择文件');
    expect(wrapper.find('textarea[readonly]').exists()).toBe(true);
    expect(wrapper.find('.subpage-layer').exists()).toBe(true);
  });

  it('exports backup text and copies it to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(SettingsView, { props: { store } });

    const backupItem = wrapper
      .findAll('button.settings-menu-item')
      .find((item) => item.text().includes('备份恢复'));
    await backupItem!.trigger('click');

    const exportButton = wrapper.findAll('button').find((item) => item.text() === '生成 JSON 文本');
    expect(exportButton).toBeDefined();
    await exportButton!.trigger('click');
    await flushPromises();

    const exportedText = (wrapper.find('textarea[readonly]').element as HTMLTextAreaElement).value;
    expect(JSON.parse(exportedText).schemaVersion).toBe(2);

    const copyButton = wrapper.findAll('button').find((item) => item.text() === '复制');
    expect(copyButton).toBeDefined();
    await copyButton!.trigger('click');
    await flushPromises();

    expect(writeText).toHaveBeenCalledWith(exportedText);
    expect(wrapper.text()).toContain('导出 JSON 已复制');
  });

  it('imports backup data from a JSON file', async () => {
    const backup = createBackupJson({
      categories: DEFAULT_CATEGORIES,
      accounts: [{ ...SEED_ACCOUNTS[0], balance: 3210 }],
      snapshots: [],
      settings: DEFAULT_SETTINGS,
      exportedAt: '2026-05-23T04:00:00.000Z',
    });
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(SettingsView, { props: { store } });

    const backupItem = wrapper
      .findAll('button.settings-menu-item')
      .find((item) => item.text().includes('备份恢复'));
    await backupItem!.trigger('click');

    const file = new File([backup], 'backup.json', { type: 'application/json' });
    Object.defineProperty(file, 'text', { value: async () => backup });
    const input = wrapper.get('input[type="file"]');
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true });
    await input.trigger('change');
    await flushPromises();

    expect(store.state.accounts).toHaveLength(1);
    expect(store.state.accounts[0].balance).toBe(3210);
    expect(wrapper.text()).toContain('备份已导入');
  });

  it('renders nested accounts and allows inline platform addition', async () => {
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(SettingsView, { props: { store } });

    // Open Category Management
    await wrapper.get('button.settings-menu-item').trigger('click');

    // Verify it lists standard seeded accounts (e.g. 招商银行, 支付宝)
    expect(wrapper.text()).toContain('招商银行');
    expect(wrapper.text()).toContain('支付宝');

    // Click "+ 新增下属平台" button for the first category
    const addTrigger = wrapper.find('.add-platform-trigger-btn');
    expect(addTrigger.exists()).toBe(true);
    await addTrigger.trigger('click');

    // Form should appear
    expect(wrapper.text()).toContain('新增平台（归属于');
    
    // Fill the form and submit
    const input = wrapper.find('.inline-add-platform-form input');
    expect(input.exists()).toBe(true);
    await input.setValue('我的新银行卡');
    
    const submitBtn = wrapper.find('.action-btn-sm.primary-sm');
    await submitBtn.trigger('click');

    // Verify platform is added to store
    expect(store.state.accounts.some(a => a.name === '我的新银行卡')).toBe(true);
  });
});
