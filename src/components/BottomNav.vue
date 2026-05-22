<script setup lang="ts">
export type TabId = 'assets' | 'entry' | 'add' | 'stats' | 'settings';

const model = defineModel<TabId>({ required: true });

const tabs: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'assets', label: '资产', icon: 'M4 18V8l8-4 8 4v10H4Z' },
  { id: 'entry', label: '录入', icon: 'M6 5h12v14H6V5Zm3 4h6M9 13h6' },
  { id: 'add', label: '添加', icon: 'M12 5v14M5 12h14' },
  { id: 'stats', label: '统计', icon: 'M5 19V9M12 19V5M19 19v-7' },
  { id: 'settings', label: '设置', icon: 'M12 3 5 7v10l7 4 7-4V7l-7-4Z' },
];
</script>

<template>
  <nav class="bottom-nav" aria-label="主导航">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="nav-item"
      :class="{ active: model === tab.id, center: tab.id === 'add' }"
      type="button"
      @click="model = tab.id"
    >
      <span class="nav-icon">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path :d="tab.icon" />
        </svg>
      </span>
      <span>{{ tab.label }}</span>
    </button>
  </nav>
</template>
