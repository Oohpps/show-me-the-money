<script setup lang="ts">
import { computed, ref } from 'vue';
import { formatMoney } from '../domain/calculations';
import type { DailySnapshot, TrendRange } from '../domain/types';

const props = defineProps<{
  snapshots: DailySnapshot[];
  currentTotal: number;
  hidden: boolean;
}>();

const range = ref<TrendRange>('day');
const rangeOptions: Array<{ id: TrendRange; label: string }> = [
  { id: 'day', label: '日' },
  { id: 'week', label: '周' },
  { id: 'month', label: '月' },
];

const chartPoints = computed(() => {
  const points = props.snapshots.length
    ? props.snapshots.map((snapshot) => ({ date: snapshot.date, value: snapshot.totalAsset }))
    : [{ date: '当前', value: props.currentTotal }];
  const values = points.map((point) => point.value);
  const min = Math.min(...values, props.currentTotal);
  const max = Math.max(...values, props.currentTotal);
  const spread = max - min || 1;

  return points.map((point, index) => ({
    ...point,
    x: points.length === 1 ? 50 : (index / (points.length - 1)) * 100,
    y: 92 - ((point.value - min) / spread) * 74,
  }));
});

const polyline = computed(() => chartPoints.value.map((point) => `${point.x},${point.y}`).join(' '));
const area = computed(() => `0,100 ${polyline.value} 100,100`);
</script>

<template>
  <section class="section-block trend-block">
    <div class="section-title-row">
      <h2>资产趋势图</h2>
      <div class="segmented">
        <button
          v-for="option in rangeOptions"
          :key="option.id"
          type="button"
          :class="{ active: range === option.id }"
          @click="range = option.id"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <svg class="trend-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="资产趋势">
      <line x1="0" x2="100" y1="20" y2="20" />
      <line x1="0" x2="100" y1="55" y2="55" />
      <line x1="0" x2="100" y1="90" y2="90" />
      <polygon :points="area" />
      <polyline :points="polyline" />
      <circle v-if="chartPoints.length" :cx="chartPoints.at(-1)?.x" :cy="chartPoints.at(-1)?.y" r="2.2" />
    </svg>

    <div class="trend-footer">
      <span>{{ chartPoints[0]?.date }}</span>
      <strong>{{ formatMoney(currentTotal, hidden) }}</strong>
      <span>{{ chartPoints.at(-1)?.date }}</span>
    </div>
  </section>
</template>
