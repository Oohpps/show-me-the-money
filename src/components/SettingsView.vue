<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';
import { useNativeBackStack } from '../composables/useNativeBackStack';
import { THEMES } from '../domain/themes';
import type { AssetCategory, Account, CategoryId } from '../domain/types';

const props = defineProps<{
  store: AssetStore;
}>();

const section = ref<'main' | 'categories' | 'themes' | 'backup'>('main');
const backupText = ref('');
const importText = ref('');
const message = ref('');
const confirmDialog = ref<{
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  extraLabel?: string;
  onExtra?: () => Promise<void>;
} | null>(null);

// Add Category Form
const categoryForm = reactive({
  name: '',
  isNegative: false,
  error: '',
});

// Collapsed state for category accordion cards (true = collapsed, false = expanded)
// By default we keep them expanded for easier management, or false
const collapsedState = reactive<Record<string, boolean>>({});

// Modal Editing States
const editingCategory = ref<AssetCategory | null>(null);
const editingCategoryForm = reactive({
  name: '',
  isNegative: false,
  active: true,
  error: '',
});

const editingAccount = ref<Account | null>(null);
const accountCategoryPickerOpen = ref(false);
const editingAccountForm = reactive({
  name: '',
  category: '' as CategoryId,
  includeInTotal: true,
  note: '',
  error: '',
});

// Inline platform addition states (by categoryId)
const inlineAddAccountCategoryId = ref<string | null>(null);
const inlineAddAccountForm = reactive({
  name: '',
  balance: '',
  includeInTotal: true,
  note: '',
  error: '',
});

// 手势识别所需的临时变量
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;

const canGoBack = () =>
  accountCategoryPickerOpen.value ||
  confirmDialog.value !== null ||
  editingAccount.value !== null ||
  editingCategory.value !== null ||
  section.value !== 'main';

function closeTopLayer() {
  if (accountCategoryPickerOpen.value) {
    accountCategoryPickerOpen.value = false;
    return;
  }

  if (confirmDialog.value) {
    confirmDialog.value = null;
    return;
  }

  if (editingAccount.value) {
    editingAccount.value = null;
    accountCategoryPickerOpen.value = false;
    return;
  }

  if (editingCategory.value) {
    editingCategory.value = null;
    return;
  }

  if (section.value !== 'main') {
    section.value = 'main';
  }
}

const { pushLayer, requestBack } = useNativeBackStack({
  canGoBack,
  goBack: closeTopLayer,
});

// 跳转到二级页面
function navigateToSection(target: typeof section.value) {
  section.value = target;
  pushLayer(`settings-${target}`);
}

// 统一的后退处理
function goBack() {
  requestBack();
}

// 触摸手势开始
function onTouchStart(e: TouchEvent) {
  if (section.value === 'main') return; // 仅在二级页面启用滑动返回
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
}

// 触摸手势结束 (作为界面内右滑返回的补充)
function onTouchEnd(e: TouchEvent) {
  if (section.value === 'main') return;
  const touch = e.changedTouches[0];
  const deltaX = touch.clientX - touchStartX;
  const deltaY = touch.clientY - touchStartY;
  const duration = Date.now() - touchStartTime;

  // 判定条件：
  // 1. 起始触点处于左侧边缘区域 (startX < 80px)
  // 2. 向右滑动距离超过 80px
  // 3. 水平方向位移明显主导 (Math.abs(deltaY) < deltaX * 0.5)
  // 4. 快速划过 (耗时小于 300ms)
  if (touchStartX < 80 && deltaX > 80 && Math.abs(deltaY) < deltaX * 0.5 && duration < 300) {
    requestBack();
  }
}

const activeThemeName = computed(
  () => THEMES.find((theme) => theme.id === props.store.state.settings.themeId)?.name ?? '包豪斯原色',
);

const exportBackup = async () => {
  backupText.value = await props.store.exportBackup();
  message.value = '备份 JSON 已生成';
};

const importBackup = async () => {
  const result = await props.store.importBackup(importText.value);
  message.value = result.ok ? '备份已导入' : result.error;
};

// First-level Category CRUD Operations
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

// Accordion Toggling
function toggleCategoryCollapse(categoryId: string) {
  collapsedState[categoryId] = !collapsedState[categoryId];
}

// Category Editing Modal
function openEditCategory(category: AssetCategory) {
  editingCategory.value = category;
  editingCategoryForm.name = category.name;
  editingCategoryForm.isNegative = category.isNegative;
  editingCategoryForm.active = category.active;
  editingCategoryForm.error = '';
  pushLayer(`settings-edit-category-${category.id}`);
}

async function saveCategoryEdit() {
  if (!editingCategory.value) return;
  if (!editingCategoryForm.name.trim()) {
    editingCategoryForm.error = '分类名称不能为空';
    return;
  }
  await props.store.updateCategory(editingCategory.value.id, {
    name: editingCategoryForm.name,
    isNegative: editingCategoryForm.isNegative,
    active: editingCategoryForm.active,
  });
  requestBack();
  message.value = '分类已更新';
}

async function handleDeleteCategory(category: AssetCategory) {
  const accountsCount = props.store.state.accounts.filter(a => a.category === category.id).length;
  confirmDialog.value = {
    title: `删除“${category.name}”？`,
    description: accountsCount > 0 ? `会同时删除 ${accountsCount} 个下属平台。` : '删除后不可恢复。',
    confirmLabel: '删除',
    onConfirm: async () => {
      await props.store.deleteCategory(category.id);
      message.value = '分类已删除';
    },
  };
  pushLayer(`settings-confirm-delete-category-${category.id}`);
}

async function confirmDialogAction(action: 'confirm' | 'extra' = 'confirm') {
  const current = confirmDialog.value;
  if (!current) return;
  if (action === 'extra' && current.onExtra) {
    await current.onExtra();
  } else {
    await current.onConfirm();
  }
  requestBack();
}

function closeConfirmDialog() {
  requestBack();
}

// Second-level Account (Platform) CRUD Operations
function openEditAccount(account: Account) {
  editingAccount.value = account;
  accountCategoryPickerOpen.value = false;
  editingAccountForm.name = account.name;
  editingAccountForm.category = account.category;
  editingAccountForm.includeInTotal = account.includeInTotal;
  editingAccountForm.note = account.note;
  editingAccountForm.error = '';
  pushLayer(`settings-edit-account-${account.id}`);
}

const selectedAccountCategory = computed(
  () => props.store.state.categories.find((category) => category.id === editingAccountForm.category) ?? null,
);

function selectAccountCategory(categoryId: CategoryId) {
  editingAccountForm.category = categoryId;
  requestBack();
}

function toggleAccountCategoryPicker() {
  if (accountCategoryPickerOpen.value) {
    requestBack();
    return;
  }

  accountCategoryPickerOpen.value = true;
  pushLayer('settings-account-category-picker');
}

async function saveAccountEdit() {
  if (!editingAccount.value) return;
  if (!editingAccountForm.name.trim()) {
    editingAccountForm.error = '平台名称不能为空';
    return;
  }
  await props.store.updateAccount(editingAccount.value.id, {
    name: editingAccountForm.name,
    category: editingAccountForm.category,
    includeInTotal: editingAccountForm.includeInTotal,
    note: editingAccountForm.note,
  });
  requestBack();
  message.value = '平台已更新';
}

async function handleDeleteAccount(account: Account) {
  confirmDialog.value = {
    title: `删除“${account.name}”？`,
    description: '相关历史记录也会删除。',
    confirmLabel: '删除',
    onConfirm: async () => {
      await props.store.deleteAccount(account.id);
      message.value = '平台已删除';
    },
  };
  pushLayer(`settings-confirm-delete-account-${account.id}`);
}

// Inline platform addition inside category card
function openInlineAddAccount(categoryId: string) {
  inlineAddAccountCategoryId.value = categoryId;
  inlineAddAccountForm.name = '';
  inlineAddAccountForm.balance = '';
  inlineAddAccountForm.includeInTotal = true;
  inlineAddAccountForm.note = '';
  inlineAddAccountForm.error = '';
}

async function submitInlineAddAccount() {
  if (!inlineAddAccountCategoryId.value) return;
  if (!inlineAddAccountForm.name.trim()) {
    inlineAddAccountForm.error = '请输入平台名称';
    return;
  }
  
  const parsedVal = inlineAddAccountForm.balance.trim() === '' ? 0 : Number(inlineAddAccountForm.balance);
  if (isNaN(parsedVal)) {
    inlineAddAccountForm.error = '金额格式无效';
    return;
  }

  await props.store.addAccount({
    name: inlineAddAccountForm.name,
    category: inlineAddAccountCategoryId.value,
    balance: parsedVal,
    includeInTotal: inlineAddAccountForm.includeInTotal,
    note: inlineAddAccountForm.note,
  });

  inlineAddAccountCategoryId.value = null;
  message.value = '平台已添加';
}

const switchTheme = async (themeId: (typeof THEMES)[number]['id']) => {
  await props.store.setTheme(themeId);
  message.value = '配色已切换';
};

const clearData = async () => {
  confirmDialog.value = {
    title: '清空本地数据？',
    description: '请选择清空范围。仅清空数据会保留当前分类和平台配置，只把金额与快照归零。',
    confirmLabel: '仅清空数据',
    onConfirm: async () => {
      await props.store.clearDataOnly();
      message.value = '金额数据已清空';
    },
    extraLabel: '清空数据及结构',
    onExtra: async () => {
      await props.store.clearAll();
      message.value = '数据及结构已清空';
    },
  };
  pushLayer('settings-confirm-clear-data');
};
</script>

<template>
  <div class="page-stack" @touchstart="onTouchStart" @touchend="onTouchEnd">
    <!-- 主设置面板 (长驻不销毁，作为无缝底图) -->
    <div class="settings-main-panel">
      <section class="section-block">
        <div class="section-title-row">
          <h2>系统设置</h2>
          <span>本地数据已安全加密</span>
        </div>

        <div class="settings-list">
          <div class="settings-group">
            <h3 class="settings-group-title">资产配置</h3>

            <!-- 分类管理 -->
            <button type="button" class="settings-cell settings-menu-item is-button" @click="navigateToSection('categories')">
              <div class="settings-cell-info">
                <strong class="settings-cell-title">分类管理</strong>
                <span class="settings-cell-desc">{{ store.state.categories.length }} 个分类，可管理各级分类与平台</span>
              </div>
              <div class="settings-cell-arrow">›</div>
            </button>

            <div class="settings-cell-divider"></div>

            <!-- 扣除负资产 -->
            <div class="settings-cell">
              <div class="settings-cell-info">
                <strong class="settings-cell-title">扣除负资产</strong>
                <span class="settings-cell-desc">负资产分类会从首页总资产和趋势快照中扣除</span>
              </div>
              <div class="settings-cell-action">
                <label class="switch">
                  <input
                    :checked="store.state.settings.deductNegativeAssets"
                    type="checkbox"
                    @change="store.setDeductNegativeAssets(($event.target as HTMLInputElement).checked)"
                  />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="settings-group-title">显示设置</h3>

            <!-- 配色设置 -->
            <button type="button" class="settings-cell settings-menu-item is-button" @click="navigateToSection('themes')">
              <div class="settings-cell-info">
                <strong class="settings-cell-title">配色设置</strong>
                <span class="settings-cell-desc">当前主题配色：{{ activeThemeName }}</span>
              </div>
              <div class="settings-cell-arrow">›</div>
            </button>

            <div class="settings-cell-divider"></div>

            <!-- 隐藏金额 -->
            <div class="settings-cell">
              <div class="settings-cell-info">
                <strong class="settings-cell-title">隐藏金额</strong>
                <span class="settings-cell-desc">公共场合首页金额显示为 CNY ****</span>
              </div>
              <div class="settings-cell-action">
                <label class="switch">
                  <input
                    :checked="store.state.settings.hideAmounts"
                    type="checkbox"
                    @change="store.setHideAmounts(($event.target as HTMLInputElement).checked)"
                  />
                  <span class="switch-slider"></span>
                </label>
              </div>
            </div>
          </div>

          <div class="settings-group">
            <h3 class="settings-group-title">数据管理</h3>

            <!-- 备份恢复 -->
            <button type="button" class="settings-cell settings-menu-item is-button" @click="navigateToSection('backup')">
              <div class="settings-cell-info">
                <strong class="settings-cell-title">备份恢复</strong>
                <span class="settings-cell-desc">导出本地 JSON，或从备份 JSON 恢复数据</span>
              </div>
              <div class="settings-cell-arrow">›</div>
            </button>

            <div class="settings-cell-divider"></div>

            <!-- 清空本地数据 -->
            <button type="button" class="settings-cell is-button is-danger" @click="clearData">
              <div class="settings-cell-info">
                <strong class="settings-cell-title text-danger">清空本地数据</strong>
                <span class="settings-cell-desc">清空所有资产记录与快照，操作不可撤销</span>
              </div>
              <div class="settings-cell-arrow text-danger">›</div>
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- 二级页面滑入层 (绝对定位，立体滑入) -->
    <Transition name="subpage-slide">
      <div v-if="section !== 'main'" class="subpage-layer">
        <!-- 分类管理 -->
        <template v-if="section === 'categories'">
          <section class="form-panel">
            <div class="subpage-header">
              <button type="button" class="tiny-action" @click="goBack()">返回</button>
              <h2>分类管理</h2>
            </div>

            <div class="category-manage-list">
              <div
                v-for="category in store.state.categories"
                :key="category.id"
                class="category-accordion-card"
                :class="{ 'is-inactive': !category.active }"
              >
                <!-- 一级分类头部行 -->
                <div class="category-accordion-header">
                  <button
                    type="button"
                    class="collapse-toggle-btn"
                    @click="toggleCategoryCollapse(category.id)"
                  >
                    <span class="arrow-icon" :class="{ 'is-rotated': collapsedState[category.id] }">▼</span>
                    <strong class="category-title-text">{{ category.name }}</strong>
                  </button>
                  
                  <div class="category-badges">
                    <span class="badge" :class="category.isNegative ? 'badge-danger' : 'badge-success'">
                      {{ category.isNegative ? '负资产' : '正资产' }}
                    </span>
                    <span class="badge" :class="category.active ? 'badge-active' : 'badge-muted'">
                      {{ category.active ? '启用中' : '已停用' }}
                    </span>
                  </div>

                  <div class="header-actions">
                    <button
                      type="button"
                      class="icon-action-btn edit-btn"
                      title="编辑分类"
                      @click="openEditCategory(category)"
                    >
                      修改
                    </button>
                    <button
                      type="button"
                      class="icon-action-btn delete-btn"
                      title="删除分类"
                      @click="handleDeleteCategory(category)"
                    >
                      删除
                    </button>
                  </div>
                </div>

                <!-- 二级平台/账户折叠区域 -->
                <div v-show="!collapsedState[category.id]" class="category-accordion-content">
                  <!-- 二级平台列表 -->
                  <div class="nested-platforms-list">
                    <div
                      v-for="account in store.state.accounts.filter(a => a.category === category.id)"
                      :key="account.id"
                      class="nested-platform-row"
                    >
                      <div class="platform-info">
                        <span class="platform-name">{{ account.name }}</span>
                        <span v-if="account.note" class="platform-note" :title="account.note">{{ account.note }}</span>
                        <span v-if="!account.includeInTotal" class="badge badge-warning">不计入总资产</span>
                      </div>
                      <div class="platform-actions">
                        <button
                          type="button"
                          class="tiny-action-btn"
                          @click="openEditAccount(account)"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          class="tiny-action-btn danger-text"
                          @click="handleDeleteAccount(account)"
                        >
                          删除
                        </button>
                      </div>
                    </div>

                    <!-- 该分类下无平台时的空状态 -->
                    <div
                      v-if="store.state.accounts.filter(a => a.category === category.id).length === 0"
                      class="empty-platforms-hint"
                    >
                      该分类下暂无平台
                    </div>
                  </div>

                  <!-- 快捷新增平台按钮/表单 -->
                  <div class="inline-add-platform-container">
                    <button
                      v-if="inlineAddAccountCategoryId !== category.id"
                      type="button"
                      class="add-platform-trigger-btn"
                      @click="openInlineAddAccount(category.id)"
                    >
                      + 新增下属平台
                    </button>

                    <!-- 内联新增表单 -->
                    <div v-else class="inline-add-platform-form">
                      <h4>新增平台（归属于：{{ category.name }}）</h4>
                      
                      <div class="inline-form-field">
                        <label>平台名称</label>
                        <input
                          v-model="inlineAddAccountForm.name"
                          placeholder="例如：微信支付、招商借记卡"
                          class="form-input-sm"
                        />
                      </div>

                      <div class="inline-form-field">
                        <label>初始金额</label>
                        <input
                          v-model="inlineAddAccountForm.balance"
                          type="number"
                          step="0.01"
                          placeholder="0.00 (选填)"
                          class="form-input-sm"
                        />
                      </div>

                      <div class="inline-form-row">
                        <label class="toggle-row-sm">
                          <input v-model="inlineAddAccountForm.includeInTotal" type="checkbox" />
                          <span>计入总资产统计</span>
                        </label>
                      </div>

                      <div class="inline-form-field">
                        <label>备注说明</label>
                        <input
                          v-model="inlineAddAccountForm.note"
                          placeholder="选填备注"
                          class="form-input-sm"
                        />
                      </div>

                      <p v-if="inlineAddAccountForm.error" class="form-error-sm">
                        {{ inlineAddAccountForm.error }}
                      </p>

                      <div class="inline-form-actions">
                        <button
                          type="button"
                          class="action-btn-sm primary-sm"
                          @click="submitInlineAddAccount"
                        >
                          确认添加
                        </button>
                        <button
                          type="button"
                          class="action-btn-sm secondary-sm"
                          @click="inlineAddAccountCategoryId = null"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 新增分类的表单区 -->
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

        <!-- 配色设置 -->
        <template v-else-if="section === 'themes'">
          <section class="form-panel">
            <div class="subpage-header">
              <button type="button" class="tiny-action" @click="goBack()">返回</button>
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

        <!-- 备份恢复 -->
        <template v-else>
          <section class="form-panel">
            <div class="subpage-header">
              <button type="button" class="tiny-action" @click="goBack()">返回</button>
              <h2>备份恢复</h2>
            </div>
            <button class="secondary-action" type="button" @click="exportBackup">导出 JSON</button>
            <textarea v-model="backupText" rows="7" readonly placeholder="导出的 JSON 会显示在这里" />
            <textarea v-model="importText" rows="7" placeholder="粘贴 JSON 备份后导入" />
            <button class="primary-action" type="button" @click="importBackup">导入 JSON</button>
          </section>
        </template>
      </div>
    </Transition>

    <!-- 编辑一级分类模态弹窗 -->
    <div v-if="editingCategory" class="modal-backdrop" @click.self="requestBack()">
      <div class="modal-container" role="dialog" aria-modal="true">
        <h3 class="modal-title">编辑分类</h3>
        
        <div class="modal-body">
          <label class="field-row">
            <span>分类名称</span>
            <input v-model="editingCategoryForm.name" placeholder="分类名称" />
          </label>

          <label class="toggle-row">
            <span>
              <strong>标记为负资产</strong>
              <small>开启后，该分类下平台将被视作负债或借款</small>
            </span>
            <input v-model="editingCategoryForm.isNegative" type="checkbox" />
          </label>

          <label class="toggle-row">
            <span>
              <strong>启用状态</strong>
              <small>停用后，此分类及下属平台将从总资产中剔除，并且不再计入日常录入</small>
            </span>
            <input v-model="editingCategoryForm.active" type="checkbox" />
          </label>

          <p v-if="editingCategoryForm.error" class="form-error">
            {{ editingCategoryForm.error }}
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="primary-action" @click="saveCategoryEdit">
            保存修改
          </button>
          <button type="button" class="secondary-action" @click="requestBack()">
            取消
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑二级平台模态弹窗 -->
    <div v-if="editingAccount" class="modal-backdrop" @click.self="requestBack()">
      <div class="modal-container" role="dialog" aria-modal="true">
        <h3 class="modal-title">编辑下属平台</h3>
        
        <div class="modal-body">
          <label class="field-row">
            <span>平台名称</span>
            <input v-model="editingAccountForm.name" placeholder="平台名称" />
          </label>

          <div class="field-row">
            <span>所属一级分类</span>
            <div class="category-picker">
              <button
                type="button"
                class="category-picker-trigger"
                :aria-expanded="accountCategoryPickerOpen"
                @click="toggleAccountCategoryPicker()"
              >
                <span>
                  {{ selectedAccountCategory?.name ?? '选择分类' }}
                  <small v-if="selectedAccountCategory?.isNegative">负资产</small>
                </span>
                <span class="category-picker-arrow" :class="{ open: accountCategoryPickerOpen }">⌄</span>
              </button>

              <div v-if="accountCategoryPickerOpen" class="category-picker-menu">
                <button
                  v-for="category in store.state.categories"
                  :key="category.id"
                  type="button"
                  class="category-picker-option"
                  :class="{ selected: category.id === editingAccountForm.category }"
                  @click="selectAccountCategory(category.id)"
                >
                  <span>{{ category.name }}</span>
                  <small v-if="category.isNegative">负资产</small>
                </button>
              </div>
            </div>
          </div>

          <label class="toggle-row">
            <span>
              <strong>计入总资产</strong>
              <small>是否参与首页和趋势统计</small>
            </span>
            <input v-model="editingAccountForm.includeInTotal" type="checkbox" />
          </label>

          <label class="field-row">
            <span>备注说明</span>
            <textarea v-model="editingAccountForm.note" rows="2" placeholder="备注（选填）" />
          </label>

          <p v-if="editingAccountForm.error" class="form-error">
            {{ editingAccountForm.error }}
          </p>
        </div>

        <div class="modal-footer">
          <button type="button" class="primary-action" @click="saveAccountEdit">
            保存修改
          </button>
          <button type="button" class="secondary-action" @click="requestBack()">
            取消
          </button>
        </div>
      </div>
    </div>

    <div v-if="confirmDialog" class="modal-backdrop" @click.self="closeConfirmDialog">
      <div class="modal-container confirm-modal" role="dialog" aria-modal="true">
        <h3 class="modal-title">{{ confirmDialog.title }}</h3>
        <p class="confirm-desc">{{ confirmDialog.description }}</p>

        <div class="modal-footer confirm-footer" :class="{ 'has-extra-action': confirmDialog.onExtra }">
          <button type="button" class="secondary-action" @click="closeConfirmDialog">
            取消
          </button>
          <button
            v-if="confirmDialog.onExtra"
            type="button"
            class="primary-action danger-action"
            @click="confirmDialogAction('extra')"
          >
            {{ confirmDialog.extraLabel }}
          </button>
          <button type="button" class="primary-action danger-action" @click="confirmDialogAction">
            {{ confirmDialog.confirmLabel }}
          </button>
        </div>
      </div>
    </div>

    <p v-if="message" class="status-message">{{ message }}</p>
  </div>
</template>

<style scoped>
/* 二级子页面绝对定位层，盖在主页上面 */
.subpage-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg);
  /* 内补丁与手机外壳保持完全一致，保证刘海屏和排版的一致性 */
  padding: max(18px, env(safe-area-inset-top)) 18px calc(86px + env(safe-area-inset-bottom));
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 18px;
  /* 左侧边缘阴影，凸显覆盖层级的物理质感 */
  box-shadow: -6px 0 24px rgba(0, 0, 0, 0.12);
  overflow-y: auto; /* 二级页面内容较多时允许自滚动 */
  -webkit-overflow-scrolling: touch;
}

/* 拟真安卓官方减速缓动过渡动画 */
.subpage-slide-enter-active,
.subpage-slide-leave-active {
  transition: transform 0.28s cubic-bezier(0.1, 0.9, 0.2, 1), opacity 0.28s linear;
}

.subpage-slide-enter-from,
.subpage-slide-leave-to {
  transform: translate3d(100%, 0, 0);
  opacity: 0.9;
}

.subpage-slide-enter-to,
.subpage-slide-leave-from {
  transform: translate3d(0, 0, 0);
  opacity: 1;
}

/* Custom Category Accordion styles */
.category-accordion-card {
  border: 1px solid var(--line);
  border-radius: 18px;
  background: var(--field);
  overflow: hidden;
  margin-bottom: 12px;
  transition: all 0.2s ease;
}

.category-accordion-card:last-child {
  margin-bottom: 0;
}

.category-accordion-card.is-inactive {
  opacity: 0.65;
}

.category-accordion-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.collapse-toggle-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 0;
  background: transparent;
  padding: 0;
  text-align: left;
  cursor: pointer;
  flex: 1;
  min-width: 0;
}

.arrow-icon {
  font-size: 10px;
  color: var(--muted);
  transition: transform 0.2s ease;
}

.arrow-icon.is-rotated {
  transform: rotate(-90deg);
}

.category-title-text {
  font-size: 16px;
  font-weight: 850;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.category-badges {
  display: flex;
  gap: 6px;
  margin-left: 8px;
  margin-right: 8px;
}

.badge {
  font-size: 11px;
  font-weight: 800;
  padding: 2px 6px;
  border-radius: 6px;
  white-space: nowrap;
}

.badge-danger {
  color: var(--danger);
  background: color-mix(in srgb, var(--loss) 18%, transparent);
}

.badge-success {
  color: var(--chart);
  background: color-mix(in srgb, var(--gain) 18%, transparent);
}

.badge-active {
  color: var(--text);
  background: var(--surface-soft);
  border: 1px solid var(--line);
}

.badge-muted {
  color: var(--muted);
  background: var(--bg);
}

.badge-warning {
  color: var(--muted);
  background: var(--surface-soft);
  font-size: 10px;
  border: 1px solid var(--line);
}

.header-actions {
  display: flex;
  gap: 6px;
}

.icon-action-btn {
  border: 1px solid var(--line);
  background: var(--surface-soft);
  color: var(--text);
  font-size: 11px;
  font-weight: 800;
  padding: 4px 8px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-action-btn:hover {
  background: var(--line);
}

.icon-action-btn.delete-btn {
  color: var(--danger);
  border-color: color-mix(in srgb, var(--loss) 30%, var(--line));
  background: color-mix(in srgb, var(--loss) 8%, var(--surface));
}

.category-accordion-content {
  padding: 12px 14px;
}

.nested-platforms-list {
  display: grid;
  gap: 8px;
  margin-bottom: 12px;
}

.nested-platform-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--surface);
  border: 1px dashed var(--line);
}

.platform-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-width: 0;
}

.platform-name {
  font-size: 14px;
  font-weight: 800;
  color: var(--text);
}

.platform-note {
  font-size: 11px;
  color: var(--muted);
  background: var(--bg);
  padding: 1px 4px;
  border-radius: 4px;
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.platform-actions {
  display: flex;
  gap: 6px;
}

.tiny-action-btn {
  border: 0;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 800;
  padding: 2px 6px;
  cursor: pointer;
}

.tiny-action-btn:hover {
  color: var(--text);
  text-decoration: underline;
}

.tiny-action-btn.danger-text {
  color: color-mix(in srgb, var(--danger) 70%, var(--muted));
}

.tiny-action-btn.danger-text:hover {
  color: var(--danger);
}

.empty-platforms-hint {
  font-size: 12px;
  color: var(--muted);
  text-align: center;
  padding: 12px;
  background: var(--surface);
  border-radius: 12px;
  border: 1px dashed var(--line);
}

/* Inline Add Platform Styles */
.inline-add-platform-container {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}

.add-platform-trigger-btn {
  display: block;
  width: 100%;
  border: 1px dashed var(--line);
  background: var(--surface);
  color: var(--muted);
  font-size: 13px;
  font-weight: 850;
  padding: 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-platform-trigger-btn:hover {
  color: var(--text);
  border-color: var(--accent);
  background: var(--surface-soft);
}

.inline-add-platform-form {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 14px;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.inline-add-platform-form h4 {
  margin: 0;
  font-size: 13px;
  font-weight: 900;
  color: var(--text);
}

.inline-form-field {
  display: grid;
  gap: 4px;
}

.inline-form-field label {
  font-size: 11px;
  font-weight: 850;
  color: var(--muted);
}

.form-input-sm {
  min-height: 36px;
  padding: 6px 10px;
  font-size: 13px;
  border-radius: 8px;
}

.inline-form-row {
  display: flex;
  align-items: center;
}

.toggle-row-sm {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.toggle-row-sm input[type="checkbox"] {
  width: 16px;
  height: 16px;
  min-height: 16px;
  margin: 0;
}

.toggle-row-sm span {
  font-size: 12px;
  font-weight: 800;
  color: var(--text);
}

.form-error-sm {
  margin: 0;
  font-size: 11px;
  color: var(--danger);
  font-weight: 800;
}

.inline-form-actions {
  display: flex;
  gap: 8px;
}

.action-btn-sm {
  flex: 1;
  min-height: 32px;
  border: 0;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 900;
  cursor: pointer;
}

.action-btn-sm.primary-sm {
  background: var(--surface-strong);
  color: white;
}

.action-btn-sm.secondary-sm {
  background: var(--surface-soft);
  color: var(--text);
  border: 1px solid var(--line);
}

/* Modal Dialog Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 100;
  background: rgba(15, 23, 20, 0.45);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18px;
  animation: fadeIn 0.2s ease-out;
}

.modal-container {
  background: var(--surface);
  border-radius: 24px;
  padding: 22px;
  width: 100%;
  max-width: 420px;
  box-shadow: var(--shadow);
  display: grid;
  gap: 16px;
  animation: scaleIn 0.25s cubic-bezier(0.1, 0.9, 0.2, 1);
  border: 1px solid var(--line);
}

.modal-title {
  margin: 0;
  font-size: 20px;
  font-weight: 950;
  color: var(--text);
}

.modal-body {
  display: grid;
  gap: 14px;
}

.modal-footer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 6px;
}

.confirm-modal {
  max-width: 340px;
  gap: 12px;
}

.confirm-desc {
  margin: 0;
  color: var(--muted);
  font-size: 14px;
  line-height: 1.5;
}

.confirm-footer {
  margin-top: 8px;
}

.confirm-footer.has-extra-action {
  grid-template-columns: 1fr;
}

.danger-action {
  background: var(--danger);
  box-shadow: 0 12px 28px color-mix(in srgb, var(--danger) 20%, transparent);
}

.category-picker {
  position: relative;
  display: grid;
  gap: 8px;
  z-index: 2;
}

.category-picker-trigger,
.category-picker-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-height: 44px;
  padding: 10px 12px;
  color: var(--text);
  text-align: left;
  border: 1px solid var(--field-border);
  border-radius: 12px;
  background: white;
}

.category-picker-trigger span,
.category-picker-option span {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 850;
  color: var(--text);
}

.category-picker-trigger small,
.category-picker-option small {
  padding: 2px 7px;
  color: var(--danger);
  font-size: 11px;
  font-weight: 850;
  border-radius: 999px;
  background: color-mix(in srgb, var(--loss) 18%, transparent);
}

.category-picker-arrow {
  color: var(--muted);
  font-size: 18px;
  line-height: 1;
  transition: transform 0.2s ease;
}

.category-picker-arrow.open {
  transform: rotate(180deg);
}

.category-picker-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  left: 0;
  z-index: 3;
  display: grid;
  gap: 6px;
  max-height: 216px;
  padding: 8px;
  overflow-y: auto;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: white;
  box-shadow: 0 14px 32px color-mix(in srgb, var(--accent) 12%, transparent);
}

.category-picker-option {
  min-height: 42px;
  border-color: transparent;
  background: transparent;
}

.category-picker-option.selected {
  border-color: color-mix(in srgb, var(--accent) 16%, var(--line));
  background: var(--surface-soft);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.95); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

/* Scoped styles for minimalist premium settings page */
.settings-main-panel {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.settings-main-panel .section-block {
  padding: 18px 20px 14px;
}

.settings-main-panel .section-title-row {
  margin-bottom: 12px;
}

.settings-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  padding-top: 10px;
}

.settings-group:first-child {
  padding-top: 0;
}

.settings-group + .settings-group {
  margin-top: 4px;
  border-top: 1px solid color-mix(in srgb, var(--line) 74%, transparent);
}

.settings-group-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 2px;
  font-size: 12px;
  font-weight: 900;
  color: color-mix(in srgb, var(--surface-strong) 70%, var(--muted));
}

.settings-group-title::before {
  width: 3px;
  height: 12px;
  content: "";
  border-radius: 999px;
  background: var(--accent);
}

.settings-cell {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 54px;
  padding: 10px 4px 10px 11px;
  background: transparent;
  border: 0;
  width: 100%;
  text-align: left;
  transition: background-color 0.2s ease;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.settings-cell.is-button {
  -webkit-tap-highlight-color: transparent;
}

.settings-cell.is-button:active {
  background-color: color-mix(in srgb, var(--surface-soft) 82%, transparent);
  border-radius: 14px;
}

.settings-cell-info {
  display: grid;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.settings-cell-title {
  font-size: 15px;
  font-weight: 850;
  color: var(--text);
}

.settings-cell-desc {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.35;
}

.settings-cell-arrow {
  font-size: 20px;
  color: var(--muted);
  margin-left: 10px;
  font-weight: 300;
  line-height: 1;
}

.settings-cell-divider {
  height: 1px;
  background-color: var(--line);
  margin-left: 11px;
  opacity: 0.72;
}

.text-danger {
  color: var(--danger) !important;
}

.settings-cell.is-danger:active {
  background-color: color-mix(in srgb, var(--loss) 8%, var(--surface-soft));
  border-radius: 12px;
}

/* Premium Switch Toggle Slider */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 28px;
  -webkit-tap-highlight-color: transparent !important;
  -webkit-focus-ring-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
  -webkit-tap-highlight-color: transparent !important;
  -webkit-focus-ring-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--surface-soft);
  transition: .25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 34px;
  border: 1px solid var(--line);
  -webkit-tap-highlight-color: transparent !important;
  -webkit-focus-ring-color: transparent !important;
  outline: none !important;
  box-shadow: none !important;
  touch-action: manipulation;
}

.switch-slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .25s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

input:checked + .switch-slider {
  background-color: var(--accent);
  border-color: var(--accent);
}

input:checked + .switch-slider:before {
  transform: translateX(22px);
}
</style>
