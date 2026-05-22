<script setup lang="ts">
import { computed, reactive, watchEffect } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { parseAmount } from '../domain/calculations';
import type { CategoryId } from '../domain/types';

const props = defineProps<{
  store: AssetStore;
}>();

const emit = defineEmits<{
  created: [];
}>();

const form = reactive({
  name: '',
  category: '' as CategoryId,
  balance: '',
  includeInTotal: true,
  note: '',
  error: '',
});

const activeCategories = computed(() => props.store.activeCategories.value);

watchEffect(() => {
  if (!form.category && activeCategories.value.length > 0) {
    form.category = activeCategories.value[0].id;
  }
});

const submit = async () => {
  const amount = parseAmount(form.balance);
  if (!form.name.trim()) {
    form.error = '请输入平台名称';
    return;
  }
  if (!form.category) {
    form.error = '请先选择或新增一个分类';
    return;
  }
  if (amount === null) {
    form.error = '请输入有效金额';
    return;
  }

  await props.store.addAccount({
    name: form.name,
    category: form.category,
    balance: amount,
    includeInTotal: form.includeInTotal,
    note: form.note,
  });
  emit('created');
};
</script>

<template>
  <form class="page-stack" @submit.prevent="submit">
    <section class="form-panel">
      <h2>新增平台</h2>
      <label class="field-row">
        <span>平台名称</span>
        <input v-model="form.name" placeholder="例如：支付宝、招商银行" />
      </label>
      <label class="field-row">
        <span>所属分类</span>
        <select v-model="form.category">
          <option v-for="category in activeCategories" :key="category.id" :value="category.id">
            {{ category.name }}{{ category.isNegative ? '（负资产）' : '' }}
          </option>
        </select>
      </label>
      <label class="field-row">
        <span>当前金额</span>
        <input v-model="form.balance" type="number" inputmode="decimal" step="0.01" placeholder="0.00" />
      </label>
      <label class="toggle-row">
        <span>
          <strong>计入总资产</strong>
          <small>是否参与首页和趋势统计</small>
        </span>
        <input v-model="form.includeInTotal" type="checkbox" />
      </label>
      <label class="field-row">
        <span>备注</span>
        <textarea v-model="form.note" rows="3" placeholder="选填" />
      </label>
    </section>
    <p v-if="form.error" class="form-error">{{ form.error }}</p>
    <button class="primary-action" type="submit">添加平台</button>
  </form>
</template>
