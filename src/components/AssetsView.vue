<script setup lang="ts">
import { computed } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { getSnapshotChange } from '../domain/calculations';
import AssetSummaryCard from './AssetSummaryCard.vue';
import CategoryGrid from './CategoryGrid.vue';

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
      :snapshots="store.visibleSnapshots.value"
      @open-stats="$emit('openStats')"
    />
    <CategoryGrid
      :categories="store.homepageCategories.value"
      :totals="store.categoryDisplayTotals.value"
      :accounts="store.state.accounts"
      :hidden="store.state.settings.hideAmounts"
      @open="$emit('openStats')"
    />
  </div>
</template>
