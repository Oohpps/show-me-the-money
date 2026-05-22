<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { formatMoney, getVisibleTrendSnapshots } from '../domain/calculations';
import type { DailySnapshot } from '../domain/types';

interface TrendPoint {
  date: string;
  value: number;
}

const props = defineProps<{
  snapshots?: DailySnapshot[];
  points?: TrendPoint[];
  currentTotal: number;
  hidden: boolean;
  title?: string;
  emptyText?: string;
}>();

const windowSize = ref(8);
const sourcePoints = computed<TrendPoint[]>(() =>
  props.points ?? (props.snapshots ?? []).map((snapshot) => ({ date: snapshot.date, value: snapshot.totalAsset })),
);
const maxWindowSize = computed(() => Math.max(1, sourcePoints.value.length));
const visiblePoints = computed(() => getVisibleTrendSnapshots(sourcePoints.value, windowSize.value));

watch(
  () => sourcePoints.value.length,
  (length) => {
    windowSize.value = Math.max(1, Math.min(windowSize.value, length || 1));
  },
  { immediate: true },
);

const zoomIn = () => {
  windowSize.value = Math.max(1, windowSize.value - 1);
};

const zoomOut = () => {
  windowSize.value = Math.min(maxWindowSize.value, windowSize.value + 1);
};

const chartPoints = computed(() => {
  const points = visiblePoints.value.length ? visiblePoints.value : [{ date: '当前', value: props.currentTotal }];
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
  <section class="section-block trend-block" :class="{ 'is-empty': sourcePoints.length === 0 }">
    <div class="section-title-row">
      <h2>{{ title ?? '资产趋势图' }}</h2>
      <div class="zoom-controls" aria-label="趋势图缩放">
        <button type="button" :disabled="windowSize <= 1" aria-label="放大范围" @click="zoomIn">+</button>
        <button type="button" :disabled="windowSize >= maxWindowSize" aria-label="缩小范围" @click="zoomOut">-</button>
      </div>
    </div>

    <label class="range-control">
      <span>{{ sourcePoints.length ? `最近 ${windowSize} 次录入 / 共 ${sourcePoints.length} 次` : (emptyText ?? '暂无录入快照') }}</span>
      <input
        v-model.number="windowSize"
        type="range"
        :min="1"
        :max="maxWindowSize"
        :disabled="sourcePoints.length <= 1"
      />
    </label>

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
