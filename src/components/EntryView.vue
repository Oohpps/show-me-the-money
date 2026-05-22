<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { CATEGORIES } from '../domain/categories';
import { parseAmount } from '../domain/calculations';
import AmountInput from './AmountInput.vue';

const props = defineProps<{
  store: AssetStore;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const form = reactive<Record<string, string>>({});
const error = reactive({ message: '' });

watchEffect(() => {
  for (const account of props.store.state.accounts) {
    if (!(account.id in form)) {
      form[account.id] = String(account.balance);
    }
  }
});

const groupedAccounts = computed(() =>
  CATEGORIES.map((category) => ({
    category,
    accounts: props.store.state.accounts.filter((account) => account.category === category.id),
  })).filter((group) => group.accounts.length > 0),
);

const save = async () => {
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
  await props.store.saveBalances(balances);
  emit('saved');
};
</script>

<template>
  <form class="page-stack" @submit.prevent="save">
    <section v-for="group in groupedAccounts" :key="group.category.id" class="form-panel">
      <h2>{{ group.category.label }}</h2>
      <AmountInput
        v-for="account in group.accounts"
        :key="account.id"
        v-model="form[account.id]"
        :label="account.name"
        :note="account.note"
      />
    </section>
    <p v-if="error.message" class="form-error">{{ error.message }}</p>
    <button class="primary-action" type="submit">保存今日快照</button>
  </form>
</template>
