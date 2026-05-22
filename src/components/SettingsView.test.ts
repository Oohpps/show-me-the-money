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
    expect(wrapper.find('button.settings-menu-item').exists()).toBe(false);
  });

  it('opens theme settings and switches the selected theme', async () => {
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(SettingsView, { props: { store } });
    const menuItems = wrapper.findAll('button.settings-menu-item');

    await menuItems[1].trigger('click');

    expect(wrapper.text()).toContain('经典灰');
    expect(wrapper.text()).toContain('深海蓝');

    const oceanCard = wrapper.findAll('button.theme-card').find((item) => item.text().includes('深海蓝'));
    expect(oceanCard).toBeDefined();
    await oceanCard!.trigger('click');

    expect(store.state.settings.themeId).toBe('ocean');
  });
});
