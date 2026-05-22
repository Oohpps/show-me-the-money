import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createAssetStore } from '../composables/useAssetStore';
import { MemoryAssetRepository } from '../storage/db';
import AppShell from './AppShell.vue';

describe('AppShell', () => {
  it('switches the amount visibility icon after hiding amounts', async () => {
    const store = createAssetStore(new MemoryAssetRepository());
    await store.load();
    const wrapper = mount(AppShell, { props: { store } });

    expect(wrapper.find('button[aria-label="隐藏金额"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="eye-off-icon"]').exists()).toBe(false);

    await wrapper.get('button[aria-label="隐藏金额"]').trigger('click');

    expect(store.state.settings.hideAmounts).toBe(true);
    expect(wrapper.find('button[aria-label="显示金额"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="eye-off-icon"]').exists()).toBe(true);
  });
});
