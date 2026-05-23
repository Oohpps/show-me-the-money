<script setup lang="ts">
import { computed, reactive, ref, watchEffect } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { parseAmount } from '../domain/calculations';
import AmountInput from './AmountInput.vue';

const props = defineProps<{
  store: AssetStore;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const form = reactive<Record<string, string | number>>({});
const getLocalDateKey = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const entry = reactive({
  date: getLocalDateKey(),
});
const error = reactive({ message: '' });
const isSaving = ref(false);

const normalizeDateInput = (value: string): string | null => {
  const match = value.trim().match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return getLocalDateKey(date);
};

const dateDisplay = computed({
  get: () => entry.date.replaceAll('-', '/'),
  set: (value: string) => {
    entry.date = value.replace(/[./]/g, '-');
  },
});

const commitDateInput = () => {
  const normalized = normalizeDateInput(entry.date);
  if (normalized) {
    entry.date = normalized;
  }
};

const shiftDate = (days: number) => {
  const normalized = normalizeDateInput(entry.date);
  const base = normalized ? new Date(`${normalized}T00:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  entry.date = getLocalDateKey(base);
  error.message = '';
};

const selectToday = () => {
  entry.date = getLocalDateKey();
  error.message = '';
};

watchEffect(() => {
  for (const account of props.store.state.accounts) {
    if (!(account.id in form)) {
      form[account.id] = String(account.balance);
    }
  }
});

const groupedAccounts = computed(() =>
  props.store.state.categories
    .map((category) => ({
      category,
      accounts: props.store.state.accounts.filter((account) => account.category === category.id),
    }))
    .filter((group) => group.accounts.length > 0),
);

const save = async () => {
  if (isSaving.value) {
    return;
  }

  const normalizedDate = normalizeDateInput(entry.date);
  if (!normalizedDate) {
    error.message = '请输入有效录入日期';
    return;
  }
  entry.date = normalizedDate;

  const balances: Record<string, number> = {};
  for (const account of props.store.state.accounts) {
    const amount = parseAmount(form[account.id] ?? '');
    if (amount === null) {
      error.message = `${account.name} 的金额无效`;
      return;
    }
    balances[account.id] = amount;
  }
  error.message = '';
  isSaving.value = true;
  try {
    await props.store.saveBalances(balances, normalizedDate);
    emit('saved');
  } catch {
    error.message = '保存失败，请稍后重试';
  } finally {
    isSaving.value = false;
  }
};
</script>

<template>
  <form class="page-stack" @submit.prevent="save">
    <section class="form-panel">
      <h2>录入日期</h2>
      <div class="date-control" aria-label="快照日期">
        <button type="button" class="date-step-btn" aria-label="前一天" @click="shiftDate(-1)">−</button>
        <label class="date-input-wrap">
          <span>快照日期</span>
          <input
            v-model="dateDisplay"
            aria-label="快照日期"
            inputmode="numeric"
            placeholder="YYYY/MM/DD"
            type="text"
            @blur="commitDateInput"
          />
        </label>
        <button type="button" class="date-step-btn" aria-label="后一天" @click="shiftDate(1)">+</button>
        <button type="button" class="date-today-btn" @click="selectToday">今天</button>
      </div>
    </section>

    <section v-for="group in groupedAccounts" :key="group.category.id" class="form-panel">
      <h2>{{ group.category.name }}{{ group.category.isNegative ? '（负资产）' : '' }}</h2>
      <AmountInput
        v-for="account in group.accounts"
        :key="account.id"
        v-model="form[account.id]"
        :label="account.name"
        :note="account.note"
      />
    </section>
    <p v-if="error.message" class="form-error">{{ error.message }}</p>
    <button class="primary-action" type="submit" :disabled="isSaving">
      {{ isSaving ? '保存中...' : '保存本次快照' }}
    </button>
  </form>
</template>
