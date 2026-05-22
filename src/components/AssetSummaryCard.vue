<script setup lang="ts">
import { formatMoney, formatSignedMoney } from '../domain/calculations';

defineProps<{
  total: number;
  change: number;
  hidden: boolean;
}>();
</script>

<template>
  <section class="summary-card">
    <div>
      <p class="card-label">总资产（CNY）</p>
      <strong>{{ formatMoney(total, hidden) }}</strong>
    </div>
    <div class="change-pill" :class="{ loss: change < 0 }">
      {{ formatSignedMoney(change, hidden) }} 较上次
    </div>
  </section>
</template>
