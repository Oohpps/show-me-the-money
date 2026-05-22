# Mobile Asset App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Vue 3 + TypeScript personal asset dashboard app with local persistence, dashboard, entry, add, stats, settings, tests, and Capacitor-ready packaging.

**Architecture:** The app is a Vite SPA with small Vue components, pure TypeScript domain helpers, and an IndexedDB-backed repository. UI state lives in a single composable store so pages can share accounts, snapshots, settings, and import/export flows without a server.

**Tech Stack:** Vue 3, TypeScript, Vite, Vitest, @vue/test-utils, jsdom, IndexedDB, Capacitor Android.

---

## File Structure

- `package.json`: scripts and dependencies.
- `index.html`, `vite.config.ts`, `tsconfig*.json`: Vite/Vue/TS project setup.
- `src/main.ts`, `src/App.vue`: app boot and shell composition.
- `src/styles.css`: app-wide mobile design tokens and responsive layout.
- `src/domain/types.ts`: category, account, snapshot, settings, backup types.
- `src/domain/categories.ts`: fixed category metadata and seeded platform data.
- `src/domain/calculations.ts`: pure asset total, category total, snapshot, trend, format, and validation helpers.
- `src/domain/backup.ts`: backup export/import validation helpers.
- `src/storage/db.ts`: IndexedDB adapter and fallback seed loading.
- `src/composables/useAssetStore.ts`: state actions consumed by Vue pages.
- `src/components/*.vue`: focused page and shared UI components.
- `src/domain/*.test.ts`, `src/composables/*.test.ts`: behavior tests.
- `capacitor.config.ts`: Android package metadata after Capacitor dependency is available.
- `README.md`: run, build, backup, and Android packaging notes.

## Task 1: Scaffold Vue Project

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/main.ts`
- Create: `src/App.vue`
- Create: `src/styles.css`

- [ ] Add Vite, Vue, TypeScript, Vitest, jsdom, Vue test utils, and Capacitor package scripts.
- [ ] Install dependencies with `npm.cmd install`.
- [ ] Run `npm.cmd run build` and expect the initial shell to compile.

## Task 2: Domain Model And Pure Tests

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/categories.ts`
- Create: `src/domain/calculations.test.ts`
- Create: `src/domain/calculations.ts`

- [ ] Write tests for total assets excluding non-total accounts and including negative liabilities.
- [ ] Write tests for category totals grouped by fixed categories.
- [ ] Write tests for current-date snapshot upsert semantics.
- [ ] Run tests and verify they fail because helpers are not implemented.
- [ ] Implement the helpers.
- [ ] Run tests and verify they pass.

## Task 3: Backup Import And Export

**Files:**
- Create: `src/domain/backup.test.ts`
- Create: `src/domain/backup.ts`

- [ ] Write tests for JSON backup creation with `schemaVersion`.
- [ ] Write tests for rejecting invalid JSON and unsupported schema versions.
- [ ] Run tests and verify they fail.
- [ ] Implement backup serialization and validation.
- [ ] Run tests and verify they pass.

## Task 4: Local Store And IndexedDB Repository

**Files:**
- Create: `src/storage/db.ts`
- Create: `src/composables/useAssetStore.test.ts`
- Create: `src/composables/useAssetStore.ts`

- [ ] Write store tests for seed loading, account creation, balance saving, snapshot upsert, amount hiding, export, and import.
- [ ] Run tests and verify they fail.
- [ ] Implement the in-memory state actions and IndexedDB persistence adapter.
- [ ] Run tests and verify they pass in jsdom.

## Task 5: Mobile App Shell And Dashboard

**Files:**
- Modify: `src/App.vue`
- Modify: `src/styles.css`
- Create: `src/components/AppShell.vue`
- Create: `src/components/BottomNav.vue`
- Create: `src/components/AssetsView.vue`
- Create: `src/components/AssetSummaryCard.vue`
- Create: `src/components/CategoryGrid.vue`
- Create: `src/components/TrendChart.vue`

- [ ] Implement the five-tab mobile shell: Assets, Entry, Add, Stats, Settings.
- [ ] Build the Assets page with total card, category cards, trend switch, and masked amount support.
- [ ] Use code-native SVG icons and CSS chart rendering.
- [ ] Keep the first viewport optimized for OnePlus 12 portrait proportions.

## Task 6: Entry, Add, Stats, And Settings Pages

**Files:**
- Create: `src/components/EntryView.vue`
- Create: `src/components/AddAccountView.vue`
- Create: `src/components/StatsView.vue`
- Create: `src/components/SettingsView.vue`
- Create: `src/components/AmountInput.vue`

- [ ] Implement batch balance editing and save feedback.
- [ ] Implement account creation with fixed category select and include-in-total switch.
- [ ] Implement category statistics with proportion bars and platform details.
- [ ] Implement settings actions for hiding amounts, export JSON, import JSON, and clear data confirmation.

## Task 7: Capacitor And Documentation

**Files:**
- Create: `capacitor.config.ts`
- Create: `README.md`
- Modify: `package.json`

- [ ] Add Capacitor config with app id `com.oohpps.showmethemoney`.
- [ ] Add Android packaging commands to README.
- [ ] Document that final APK build requires Android SDK/Android Studio.
- [ ] Run `npm.cmd run build`.

## Task 8: Browser Verification And Final Commit

**Files:**
- Modify only if verification finds issues.

- [ ] Start dev server with `npm.cmd run dev -- --host 127.0.0.1`.
- [ ] Verify the app in a mobile viewport and desktop viewport.
- [ ] Check the core workflow: add account, save balances, view dashboard, toggle hidden amounts, export backup, import backup.
- [ ] Run `npm.cmd test -- --run`.
- [ ] Run `npm.cmd run build`.
- [ ] Commit completed work with `git commit -m "feat: build mobile asset app"`.

