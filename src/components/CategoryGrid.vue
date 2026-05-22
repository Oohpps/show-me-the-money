<script setup lang="ts">
import { computed } from 'vue';
import { CATEGORIES } from '../domain/categories';
import { formatMoney } from '../domain/calculations';
import type { Account, CategoryId } from '../domain/types';

const props = defineProps<{
  totals: Record<CategoryId, number>;
  accounts: Account[];
  hidden: boolean;
}>();

defineEmits<{
  open: [category: CategoryId];
}>();

const accountCount = computed(() => {
  const counts = Object.fromEntries(CATEGORIES.map((category) => [category.id, 0])) as Record<CategoryId, number>;
  for (const account of props.accounts) {
    counts[account.category] += 1;
  }
  return counts;
});
</script>

<template>
  <section class="section-block">
    <div class="section-title-row">
      <h2>资产分类</h2>
      <span>{{ accounts.length }} 个平台</span>
    </div>
    <div class="category-grid">
      <button
        v-for="category in CATEGORIES"
        :key="category.id"
        class="category-card"
        type="button"
        @click="$emit('open', category.id)"
      >
        <span class="category-icon">{{ category.shortLabel.slice(0, 1) }}</span>
        <span class="category-name">{{ category.label }}</span>
        <strong>{{ formatMoney(totals[category.id], hidden) }}</strong>
        <small>{{ accountCount[category.id] }} 个平台</small>
      </button>
    </div>
  </section>
</template>
