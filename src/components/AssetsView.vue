<script setup lang="ts">
import { computed } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { getSnapshotChange } from '../domain/calculations';
import AssetSummaryCard from './AssetSummaryCard.vue';
import CategoryGrid from './CategoryGrid.vue';
import TrendChart from './TrendChart.vue';

const props = defineProps<{
  store: AssetStore;
}>();

defineEmits<{
  openStats: [];
}>();

const monthChange = computed(() =>
  getSnapshotChange(props.store.state.snapshots),
);
</script>

<template>
  <div class="page-stack">
    <AssetSummaryCard
      :total="store.totalAsset.value"
      :change="monthChange"
      :hidden="store.state.settings.hideAmounts"
    />
    <CategoryGrid
      :totals="store.categoryTotals.value"
      :accounts="store.state.accounts"
      :hidden="store.state.settings.hideAmounts"
      @open="$emit('openStats')"
    />
    <TrendChart
      :snapshots="store.visibleSnapshots.value"
      :current-total="store.totalAsset.value"
      :hidden="store.state.settings.hideAmounts"
    />
  </div>
</template>
