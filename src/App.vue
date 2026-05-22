<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import AppShell from './components/AppShell.vue';
import { useAssetStore } from './composables/useAssetStore';
import { authenticateApp } from './native/biometric';

const store = useAssetStore();
const isUnlocked = ref(false);
const isAuthenticating = ref(false);
const authFailed = ref(false);

watchEffect(() => {
  document.documentElement.dataset.theme = store.state.settings.themeId;
});

async function unlockApp() {
  isAuthenticating.value = true;
  authFailed.value = false;

  const verified = await authenticateApp();
  if (!verified) {
    authFailed.value = true;
    isAuthenticating.value = false;
    return;
  }

  await store.load();
  isUnlocked.value = true;
  isAuthenticating.value = false;
}

void unlockApp();
</script>

<template>
  <AppShell v-if="isUnlocked" :store="store" />
  <main v-else class="phone-shell auth-shell">
    <section class="auth-panel" aria-live="polite">
      <div class="auth-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 11v4" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          <path d="M6 11h12v9H6z" />
        </svg>
      </div>
      <h1>验证身份</h1>
      <p>{{ authFailed ? '认证已取消，请重新验证后进入应用。' : '请使用系统指纹认证进入应用。' }}</p>
      <button class="primary-action" type="button" :disabled="isAuthenticating" @click="unlockApp">
        {{ isAuthenticating ? '正在验证...' : '重新验证' }}
      </button>
    </section>
  </main>
</template>
