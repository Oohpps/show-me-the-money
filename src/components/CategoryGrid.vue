<script setup lang="ts">
import { computed } from 'vue';
import { roundMoney } from '../domain/calculations';
import type { Account, AssetCategory, CategoryId } from '../domain/types';

const props = defineProps<{
  categories: AssetCategory[];
  totals: Record<CategoryId, number>;
  accounts: Account[];
  hidden: boolean;
}>();

defineEmits<{
  open: [category: CategoryId];
}>();

const accountCount = computed(() => {
  const counts = Object.fromEntries(props.categories.map((category) => [category.id, 0])) as Record<CategoryId, number>;
  for (const account of props.accounts) {
    if (account.category in counts) {
      counts[account.category] += 1;
    }
  }
  return counts;
});

const visibleAccountCount = computed(() =>
  Object.values(accountCount.value).reduce((total, count) => total + count, 0),
);

const iconPaths: Record<string, string> = {
  bank: 'M3 7h18v12H3V7Zm0 4h18M6 15h6',
  payment: 'M5 7h14v10H5V7Zm10 3h4v4h-4v-4Zm2 2h2',
  stock: 'M4 17l5-5 4 3 7-8M16 7h4v4',
  cash: 'M6 7h12v10H6V7Zm2 3h8M9 14h3',
  liability: 'M12 4 21 20H3L12 4Zm0 6v5M12 18h.01',
};

const categoryCardClass = (category: AssetCategory): string => `category-card--${category.id}`;
const getIconPath = (category: AssetCategory): string => iconPaths[category.id] ?? iconPaths.bank;

const formatCardAmount = (value: number): string => {
  if (props.hidden) {
    return '****';
  }

  return roundMoney(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
</script>

<template>
  <section class="section-block">
    <div class="section-title-row">
      <h2>资产分类</h2>
      <span>{{ visibleAccountCount }} 个平台</span>
    </div>
    <div class="category-grid">
      <button
        v-for="category in categories"
        :key="category.id"
        class="category-card"
        :class="[categoryCardClass(category), { negative: category.isNegative }]"
        type="button"
        @click="$emit('open', category.id)"
      >
        <span class="category-card-top">
          <span class="category-card-title">
            <span class="category-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path :d="getIconPath(category)" />
              </svg>
            </span>
            <span class="category-name">{{ category.name }}</span>
          </span>
          <span class="category-count">{{ accountCount[category.id] ?? 0 }} 个平台</span>
        </span>
        <strong><span>¥</span>{{ formatCardAmount(totals[category.id] ?? 0) }}</strong>
        <span class="category-card-mark">{{ category.shortName.slice(0, 1) }}</span>
      </button>
    </div>
  </section>
</template>
