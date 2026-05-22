<script setup lang="ts">
import { ref } from 'vue';
import type { AssetStore } from '../composables/useAssetStore';

const props = defineProps<{
  store: AssetStore;
}>();

const backupText = ref('');
const importText = ref('');
const message = ref('');

const exportBackup = async () => {
  backupText.value = await props.store.exportBackup();
  message.value = '备份 JSON 已生成';
};

const importBackup = async () => {
  const result = await props.store.importBackup(importText.value);
  message.value = result.ok ? '备份已导入' : result.error;
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
