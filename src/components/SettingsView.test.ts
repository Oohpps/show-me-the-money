import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createAssetStore } from '../composables/useAssetStore';
import { MemoryAssetRepository } from '../storage/db';
import SettingsView from './SettingsView.vue';

describe('SettingsView', () => {
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

    expect(wrapper.text()).toContain('导出 JSON');
    expect(wrapper.find('textarea[readonly]').exists()).toBe(true);
    expect(wrapper.find('.subpage-layer').exists()).toBe(true);
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
