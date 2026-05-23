import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { createAssetStore } from '../composables/useAssetStore';
import { MemoryAssetRepository, type AssetData } from '../storage/db';
import EntryView from './EntryView.vue';

class FailingWriteRepository extends MemoryAssetRepository {
  async write(_data: AssetData): Promise<void> {
    throw new Error('write failed');
  }
}

describe('EntryView', () => {
  it('submits edited balances and emits saved', async () => {
    const store = createAssetStore(new MemoryAssetRepository(), () => new Date('2026-05-22T10:00:00.000Z'));
    await store.load();
    const wrapper = mount(EntryView, { props: { store } });

    await wrapper.get('input[aria-label="快照日期"]').setValue('2026/05/20');
    const alipayInput = wrapper.get('input[aria-label="支付宝"]');
    await alipayInput.setValue('1234.56');
    await wrapper.get('form').trigger('submit');

    expect(store.state.accounts.find((account) => account.id === 'alipay')?.balance).toBe(1234.56);
    expect(store.state.snapshots.find((snapshot) => snapshot.date === '2026-05-20')?.accountBalances.alipay).toBe(
      1234.56,
    );
    expect(wrapper.emitted('saved')).toHaveLength(1);
  });

  it('keeps submission working in the current session when persistent storage rejects writes', async () => {
    const store = createAssetStore(new FailingWriteRepository(), () => new Date('2026-05-22T10:00:00.000Z'));
    await store.load();
    const wrapper = mount(EntryView, { props: { store } });

    await wrapper.get('input[aria-label="支付宝"]').setValue('888');
    await wrapper.get('form').trigger('submit');

    expect(store.state.accounts.find((account) => account.id === 'alipay')?.balance).toBe(888);
    expect(store.state.statusMessage).toBe('本地存储暂不可用，本次修改仅在当前会话保留');
    expect(wrapper.emitted('saved')).toHaveLength(1);
  });
});
