<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import AddAccountView from './AddAccountView.vue';
import AssetsView from './AssetsView.vue';
import BottomNav, { type TabId } from './BottomNav.vue';
import EntryView from './EntryView.vue';
import SettingsView from './SettingsView.vue';
import StatsView from './StatsView.vue';

const props = defineProps<{
  store: AssetStore;
}>();

const activeTab = ref<TabId>('assets');
const pageTitle = computed(() => {
  const titles: Record<TabId, string> = {
    assets: '资产总览',
    entry: '余额录入',
    add: '新增平台',
    stats: '分类统计',
    settings: '设置',
  };
  return titles[activeTab.value];
});
</script>

<template>
  <main class="phone-shell">
    <header class="app-header">
      <button class="icon-button" aria-label="设置" @click="activeTab = 'settings'">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3 4.5 7.2v8.7L12 21l7.5-5.1V7.2L12 3Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <h1>{{ pageTitle }}</h1>
      <button
        class="icon-button"
        :aria-label="store.state.settings.hideAmounts ? '显示金额' : '隐藏金额'"
        @click="store.setHideAmounts(!store.state.settings.hideAmounts)"
      >
        <svg v-if="store.state.settings.hideAmounts" data-testid="eye-off-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 4l16 16" />
          <path d="M9.9 5.2A9.9 9.9 0 0 1 12 5c5.6 0 9 7 9 7a17 17 0 0 1-3.2 4.1" />
          <path d="M14.2 14.2A3 3 0 0 1 9.8 9.8" />
          <path d="M6.5 6.5C4.2 8.1 3 12 3 12s3.4 7 9 7a9.6 9.6 0 0 0 4.1-.9" />
        </svg>
        <svg v-else data-testid="eye-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 12s3.4-6 9-6 9 6 9 6-3.4 6-9 6-9-6-9-6Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      </button>
    </header>

    <div v-if="!store.state.loaded" class="loading-panel">正在读取本地资产数据...</div>

    <template v-else>
      <AssetsView v-if="activeTab === 'assets'" :store="props.store" @open-stats="activeTab = 'stats'" />
      <EntryView v-else-if="activeTab === 'entry'" :store="props.store" @saved="activeTab = 'assets'" />
      <AddAccountView v-else-if="activeTab === 'add'" :store="props.store" @created="activeTab = 'entry'" />
      <StatsView v-else-if="activeTab === 'stats'" :store="props.store" />
      <SettingsView v-else :store="props.store" />
    </template>

    <BottomNav v-model="activeTab" />
  </main>
</template>
