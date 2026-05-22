<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { useNativeBackStack } from '../composables/useNativeBackStack';
import { formatMoney } from '../domain/calculations';
import type { Account, AssetCategory, CategoryId } from '../domain/types';
import TrendChart from './TrendChart.vue';

interface TrendPoint {
  date: string;
  value: number;
}

const props = defineProps<{
  store: AssetStore;
}>();

type StatsDetail =
  | { type: 'total' }
  | { type: 'category'; categoryId: CategoryId };

const detail = ref<StatsDetail | null>(null);

const closeDetail = () => {
  detail.value = null;
};

const { pushLayer, requestBack } = useNativeBackStack({
  canGoBack: () => detail.value !== null,
  goBack: closeDetail,
});

const openTotalDetail = () => {
  detail.value = { type: 'total' };
  pushLayer('stats-total');
};

const openCategoryDetail = (categoryId: CategoryId) => {
  detail.value = { type: 'category', categoryId };
  pushLayer(`stats-category-${categoryId}`);
};

const rows = computed(() =>
  props.store.state.categories.map((category) => {
    const total = props.store.categoryTotals.value[category.id] ?? 0;
    const percent =
      props.store.totalAsset.value === 0
        ? 0
        : Math.max(0, (Math.abs(total) / Math.abs(props.store.totalAsset.value)) * 100);
    return {
      category,
      total,
      percent,
      accounts: props.store.state.accounts.filter((account) => account.category === category.id),
    };
  }),
);

const selectedCategory = computed<AssetCategory | null>(() => {
  if (detail.value?.type !== 'category') {
    return null;
  }

  return props.store.state.categories.find((category) => category.id === detail.value?.categoryId) ?? null;
});

const selectedAccounts = computed<Account[]>(() => {
  if (!selectedCategory.value) {
    return [];
  }

  return props.store.state.accounts.filter((account) => account.category === selectedCategory.value?.id);
});

const totalTrendPoints = computed<TrendPoint[]>(() =>
  props.store.visibleSnapshots.value.map((snapshot) => ({
    date: snapshot.date,
    value: snapshot.totalAsset,
  })),
);

const accountTrendPoints = (account: Account): TrendPoint[] =>
  props.store.visibleSnapshots.value
    .filter((snapshot) => Object.prototype.hasOwnProperty.call(snapshot.accountBalances, account.id))
    .map((snapshot) => ({
      date: snapshot.date,
      value: snapshot.accountBalances[account.id] ?? 0,
    }));

const categoryTrendPoints = (categoryId: CategoryId): TrendPoint[] =>
  props.store.visibleSnapshots.value
    .filter((snapshot) => Object.prototype.hasOwnProperty.call(snapshot.categoryTotals, categoryId))
    .map((snapshot) => ({
      date: snapshot.date,
      value: snapshot.categoryTotals[categoryId] ?? 0,
    }));

const currentCategoryTotal = computed(() =>
  selectedCategory.value ? props.store.categoryTotals.value[selectedCategory.value.id] ?? 0 : 0,
);
</script>

<template>
  <div v-if="detail" class="page-stack">
    <section class="stats-card stats-detail-title">
      <button type="button" class="tiny-action" @click="requestBack()">返回</button>
      <div>
        <h2>{{ detail.type === 'total' ? '总资产趋势' : selectedCategory?.name }}</h2>
        <span v-if="detail.type === 'category'">{{ selectedAccounts.length }} 个平台</span>
      </div>
    </section>

    <TrendChart
      v-if="detail.type === 'total'"
      title="总资产趋势图"
      :points="totalTrendPoints"
      :current-total="store.totalAsset.value"
      :hidden="store.state.settings.hideAmounts"
    />

    <template v-else-if="selectedCategory">
      <TrendChart
        :title="`${selectedCategory.name} 总趋势`"
        :points="categoryTrendPoints(selectedCategory.id)"
        :current-total="currentCategoryTotal"
        :hidden="store.state.settings.hideAmounts"
      />

      <TrendChart
        v-for="account in selectedAccounts"
        :key="account.id"
        :title="`${account.name} 趋势`"
        :points="accountTrendPoints(account)"
        :current-total="account.balance"
        :hidden="store.state.settings.hideAmounts"
        empty-text="暂无该平台快照"
      />
    </template>
  </div>

  <div v-else class="page-stack">
    <button type="button" class="stats-card stats-summary-card" @click="openTotalDetail()">
      <div class="stats-header stats-header-inline">
        <div>
          <h2>总资产</h2>
          <span>{{ store.visibleSnapshots.value.length }} 次快照</span>
        </div>
        <strong>{{ formatMoney(store.totalAsset.value, store.state.settings.hideAmounts) }}</strong>
      </div>
      <div class="bar-track">
        <span style="width: 100%" />
      </div>
    </button>

    <button
      v-for="row in rows"
      :key="row.category.id"
      type="button"
      class="stats-card stats-summary-card"
      :class="{ inactive: !row.category.active }"
      @click="openCategoryDetail(row.category.id)"
    >
      <div class="stats-header stats-header-inline">
        <div class="stats-title-line">
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
    </button>
  </div>
</template>
