<script setup lang="ts">
import { onMounted, watchEffect } from 'vue';
import AppShell from './components/AppShell.vue';
import { useAssetStore } from './composables/useAssetStore';

const store = useAssetStore();

watchEffect(() => {
  document.documentElement.dataset.theme = store.state.settings.themeId;
});

onMounted(() => {
  void store.load();
});
</script>

<template>
  <AppShell :store="store" />
</template>
