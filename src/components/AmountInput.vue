<script setup lang="ts">
defineProps<{
  label: string;
  note?: string;
}>();

const model = defineModel<string | number>({ required: true });
</script>

<template>
  <label class="amount-row">
    <span>
      <strong>{{ label }}</strong>
      <small v-if="note">{{ note }}</small>
    </span>
    <input v-model="model" :aria-label="label" type="number" inputmode="decimal" step="0.01" />
  </label>
</template>
