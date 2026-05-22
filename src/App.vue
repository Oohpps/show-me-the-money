<script setup lang="ts">
import { onMounted } from 'vue';
import AppShell from './components/AppShell.vue';
import { useAssetStore } from './composables/useAssetStore';

const store = useAssetStore();

onMounted(() => {
  void store.load();
});
</script>

<template>
  <AppShell :store="store" />
</template>
