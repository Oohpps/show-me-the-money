<script setup lang="ts">
defineProps<{
  label: string;
  note?: string;
}>();

const model = defineModel<string>({ required: true });
</script>

<template>
  <label class="amount-row">
    <span>
      <strong>{{ label }}</strong>
      <small v-if="note">{{ note }}</small>
    </span>
    <input v-model="model" type="number" inputmode="decimal" step="0.01" />
  </label>
</template>
