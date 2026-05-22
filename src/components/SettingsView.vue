<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { THEMES } from '../domain/themes';

const props = defineProps<{
  store: AssetStore;
}>();

const section = ref<'main' | 'categories' | 'themes'>('main');
const backupText = ref('');
const importText = ref('');
const message = ref('');
const categoryForm = reactive({
  name: '',
  isNegative: false,
  error: '',
});

const activeThemeName = computed(
  () => THEMES.find((theme) => theme.id === props.store.state.settings.themeId)?.name ?? '曜石绿',
);

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

const switchTheme = async (themeId: (typeof THEMES)[number]['id']) => {
  await props.store.setTheme(themeId);
  message.value = '配色已切换';
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
    <template v-if="section === 'main'">
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
        <h2>资产配置</h2>
        <div class="settings-menu">
          <button type="button" class="settings-menu-item" @click="section = 'categories'">
            <span>
              <strong>分类管理</strong>
              <small>{{ store.state.categories.length }} 个分类，可增减、停用和标记负资产</small>
            </span>
            <b>›</b>
          </button>
          <button type="button" class="settings-menu-item" @click="section = 'themes'">
            <span>
              <strong>配色设置</strong>
              <small>当前：{{ activeThemeName }}</small>
            </span>
            <b>›</b>
          </button>
        </div>
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
    </template>

    <template v-else-if="section === 'categories'">
      <section class="form-panel">
        <div class="subpage-header">
          <button type="button" class="tiny-action" @click="section = 'main'">返回</button>
          <h2>分类管理</h2>
        </div>

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
      </section>

      <section class="form-panel">
        <h2>新增分类</h2>
        <label class="field-row">
          <span>分类名称</span>
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
    </template>

    <template v-else>
      <section class="form-panel">
        <div class="subpage-header">
          <button type="button" class="tiny-action" @click="section = 'main'">返回</button>
          <h2>配色设置</h2>
        </div>
        <div class="theme-grid">
          <button
            v-for="theme in THEMES"
            :key="theme.id"
            type="button"
            class="theme-card"
            :class="{ active: store.state.settings.themeId === theme.id }"
            @click="switchTheme(theme.id)"
          >
            <span class="theme-swatches">
              <i v-for="color in theme.colors" :key="color" class="theme-swatch" :style="{ background: color }" />
            </span>
            <span class="theme-meta">
              <strong>{{ theme.name }}</strong>
              <small>{{ theme.description }}</small>
            </span>
          </button>
        </div>
      </section>
    </template>

    <p v-if="message" class="status-message">{{ message }}</p>
  </div>
</template>
