<script setup lang="ts">
import { reactive, ref } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';

const props = defineProps<{
  store: AssetStore;
}>();

const backupText = ref('');
const importText = ref('');
const message = ref('');
const categoryForm = reactive({
  name: '',
  isNegative: false,
  error: '',
});

const exportBackup = async () => {
  backupText.value = await props.store.exportBackup();
  message.value = '备份 JSON 已生成';
};

const importBackup = async () => {
  const result = await props.store.importBackup(importText.value);
  message.value = result.ok ? '备份已导入' : result.error;
};

const addCategory = async () => {
  if (!categoryForm.name.trim()) {
    categoryForm.error = '请输入分类名称';
    return;
  }

  categoryForm.error = '';
  await props.store.addCategory({
    name: categoryForm.name,
    isNegative: categoryForm.isNegative,
  });
  categoryForm.name = '';
  categoryForm.isNegative = false;
  message.value = '分类已添加';
};

const renameCategory = async (categoryId: string, currentName: string) => {
  const name = window.prompt('分类名称', currentName)?.trim();
  if (name) {
    await props.store.updateCategory(categoryId, { name });
    message.value = '分类已更新';
  }
};

const clearData = async () => {
  if (window.confirm('确认清空所有本地数据？此操作无法撤销。')) {
    await props.store.clearAll();
    message.value = '本地数据已清空';
  }
};
</script>

<template>
  <div class="page-stack">
    <section class="form-panel">
      <h2>统计设置</h2>
      <label class="toggle-row">
        <span>
          <strong>扣除负资产</strong>
          <small>开启后，负资产分类会从首页总资产和趋势快照中扣除</small>
        </span>
        <input
          :checked="store.state.settings.deductNegativeAssets"
          type="checkbox"
          @change="store.setDeductNegativeAssets(($event.target as HTMLInputElement).checked)"
        />
      </label>
    </section>

    <section class="form-panel">
      <h2>分类管理</h2>
      <div class="category-manage-list">
        <div v-for="category in store.state.categories" :key="category.id" class="category-manage-row">
          <div>
            <strong>{{ category.name }}</strong>
            <small>
              {{ category.isNegative ? '负资产' : '正资产' }} ·
              {{ category.active ? '启用中' : '已停用' }}
            </small>
          </div>
          <div class="row-actions">
            <button type="button" class="tiny-action" @click="renameCategory(category.id, category.name)">改名</button>
            <button
              type="button"
              class="tiny-action"
              @click="store.updateCategory(category.id, { isNegative: !category.isNegative })"
            >
              {{ category.isNegative ? '设为正' : '设为负' }}
            </button>
            <button
              type="button"
              class="tiny-action"
              @click="store.updateCategory(category.id, { active: !category.active })"
            >
              {{ category.active ? '停用' : '启用' }}
            </button>
          </div>
        </div>
      </div>

      <label class="field-row">
        <span>新增分类</span>
        <input v-model="categoryForm.name" placeholder="例如：房贷、现金、保险" />
      </label>
      <label class="toggle-row">
        <span>
          <strong>标记为负资产</strong>
          <small>例如信用卡、贷款、借款</small>
        </span>
        <input v-model="categoryForm.isNegative" type="checkbox" />
      </label>
      <p v-if="categoryForm.error" class="form-error">{{ categoryForm.error }}</p>
      <button class="secondary-action" type="button" @click="addCategory">添加分类</button>
    </section>

    <section class="form-panel">
      <h2>隐私显示</h2>
      <label class="toggle-row">
        <span>
          <strong>隐藏金额</strong>
          <small>公共场合显示为 CNY ****</small>
        </span>
        <input
          :checked="store.state.settings.hideAmounts"
          type="checkbox"
          @change="store.setHideAmounts(($event.target as HTMLInputElement).checked)"
        />
      </label>
    </section>

    <section class="form-panel">
      <h2>备份恢复</h2>
      <button class="secondary-action" type="button" @click="exportBackup">导出 JSON</button>
      <textarea v-model="backupText" rows="7" readonly placeholder="导出的 JSON 会显示在这里" />
      <textarea v-model="importText" rows="7" placeholder="粘贴 JSON 备份后导入" />
      <button class="primary-action" type="button" @click="importBackup">导入 JSON</button>
    </section>

    <section class="form-panel danger-panel">
      <h2>危险操作</h2>
      <button class="secondary-action danger" type="button" @click="clearData">清空本地数据</button>
    </section>

    <p v-if="message" class="status-message">{{ message }}</p>
  </div>
</template>
