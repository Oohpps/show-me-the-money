<script setup lang="ts">
import { computed } from 'vue';
import { formatMoney, formatSignedMoney } from '../domain/calculations';
import type { DailySnapshot } from '../domain/types';

const props = defineProps<{
  total: number;
  change: number;
  hidden: boolean;
  snapshots: DailySnapshot[];
}>();

defineEmits<{
  openStats: [];
}>();

const miniTrendPoints = computed(() => {
  const source = [
    ...props.snapshots.map((snapshot) => ({ date: snapshot.date, value: snapshot.totalAsset })),
    { date: '当前', value: props.total },
  ].slice(-6);

  if (source.length === 1) {
    return [
      { ...source[0], x: 8, y: 58 },
      { ...source[0], x: 96, y: 58 },
    ];
  }

  const values = source.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;

  return source.map((point, index) => ({
    ...point,
    x: 8 + (index / (source.length - 1)) * 88,
    y: 84 - ((point.value - min) / spread) * 54,
  }));
});

const miniTrendLine = computed(() => miniTrendPoints.value.map((point) => `${point.x},${point.y}`).join(' '));
const miniTrendArea = computed(() => `0,100 ${miniTrendLine.value} 100,100`);
const totalDisplay = computed(() => {
  const value = formatMoney(props.total, props.hidden);
  const [currency, ...amountParts] = value.split(' ');
  return {
    currency,
    amount: amountParts.join(' ') || value,
  };
});

const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const summaryTag = computed(() => {
  const latest = [...props.snapshots].sort((a, b) => a.date.localeCompare(b.date)).at(-1);
  return (latest?.date ?? getLocalDateKey()).replaceAll('-', '/');
});
</script>

<template>
  <button type="button" class="summary-card" @click="$emit('openStats')">
    <div class="summary-card-top">
      <p class="card-label">Total Assets / 总资产</p>
      <span class="summary-tag">{{ summaryTag }}</span>
    </div>

    <strong>
      <span class="summary-currency">{{ totalDisplay.currency }}</span>
      {{ totalDisplay.amount }}
    </strong>

    <div class="summary-card-bottom">
      <span>较上次</span>
      <b class="change-pill" :class="{ loss: change < 0 }">
        {{ formatSignedMoney(change, hidden) }}
      </b>
    </div>

    <svg class="summary-mini-chart" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <line x1="0" x2="100" y1="32" y2="32" />
      <line x1="0" x2="100" y1="58" y2="58" />
      <line x1="0" x2="100" y1="84" y2="84" />
      <polygon :points="miniTrendArea" />
      <polyline :points="miniTrendLine" />
      <circle
        v-for="point in miniTrendPoints"
        :key="`${point.date}-${point.x}`"
        :cx="point.x"
        :cy="point.y"
        r="1.6"
      />
    </svg>
  </button>
</template>
