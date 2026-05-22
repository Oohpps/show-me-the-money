<script setup lang="ts">
import { computed } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { formatMoney } from '../domain/calculations';

const props = defineProps<{
  store: AssetStore;
}>();

const rows = computed(() =>
  props.store.state.categories.map((category) => {
    const total = props.store.categoryTotals.value[category.id] ?? 0;
    const percent = props.store.totalAsset.value === 0 ? 0 : Math.max(0, (Math.abs(total) / Math.abs(props.store.totalAsset.value)) * 100);
    return {
      category,
      total,
      percent,
      accounts: props.store.state.accounts.filter((account) => account.category === category.id),
    };
  }),
);
</script>

<template>
  <div class="page-stack">
    <section v-for="row in rows" :key="row.category.id" class="stats-card" :class="{ inactive: !row.category.active }">
      <div class="stats-header">
        <div>
          <h2>{{ row.category.name }}{{ row.category.isNegative ? '（负资产）' : '' }}</h2>
          <span>{{ row.accounts.length }} 个平台{{ row.category.active ? '' : '，已停用' }}</span>
        </div>
        <strong>{{ formatMoney(row.total, store.state.settings.hideAmounts) }}</strong>
      </div>
      <div class="bar-track">
        <span :style="{ width: `${Math.min(row.percent, 100)}%` }" />
      </div>
      <div class="platform-list">
        <div v-for="account in row.accounts" :key="account.id">
          <span>{{ account.name }}</span>
          <strong>{{ formatMoney(account.balance, store.state.settings.hideAmounts) }}</strong>
        </div>
      </div>
    </section>
  </div>
</template>
