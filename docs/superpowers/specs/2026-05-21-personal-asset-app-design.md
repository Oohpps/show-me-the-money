# Personal Asset App Design

Date: 2026-05-21

## Goal

Build a private Android app for a OnePlus 12 that summarizes personal assets by platform and category. The app is for side-loaded personal use only. It does not need app store publishing, login, cloud sync, or transaction-level bookkeeping.

The first version records platform balances, such as Alipay, WeChat, China Merchants Bank, fund platforms, and stock accounts. Each save creates or updates a daily balance snapshot so the app can show asset trends without recording every transaction.

## Technical Direction

Use Vue 3, TypeScript, Vite, and Capacitor.

- Vue 3 and TypeScript implement the mobile single-page app.
- Vite handles local development and web builds.
- Capacitor wraps the built app into an Android WebView project.
- IndexedDB stores all user data locally on the phone.
- JSON export and import provide backup and restore.

The project will first be verified in a browser. After the UI and local data behavior are accepted, Capacitor Android packaging can produce a debug APK. The current machine does not have Android SDK detected, so final APK generation requires Android Studio or Android SDK installation before running the Android build.

## Product Scope

Included in version 1:

- Asset dashboard with total assets, change summary, category cards, and trend chart.
- Platform balance entry with both single-platform edit and batch entry.
- Custom asset categories and custom platform accounts under those categories.
- Category statistics with totals, percentages, and platform details.
- Trend details based on actual saved balance snapshots, with manual zoom range controls.
- Settings for category management, deducting negative assets, JSON export, JSON import, amount hiding, and data clearing.
- Local-only storage and offline use.

Not included in version 1:

- Cloud sync.
- User accounts.
- Formal app store publishing.
- Automatic bank, Alipay, or WeChat balance reading.
- Transaction-level ledger records.
- Multi-device conflict handling.

## Navigation

The app uses a five-item bottom navigation:

- Assets: main dashboard.
- Entry: batch balance entry.
- Add: center prominent add button for new platforms.
- Stats: category statistics.
- Settings: backup, restore, privacy display, and app settings.

The app should open directly to the Assets page.

## Pages

### Assets

The Assets page is the default home page.

It shows:

- Total asset card with CNY total.
- Change summary compared with the previous recorded snapshot.
- Category card grid.
- Asset trend chart based on recorded snapshot count, with manual zoom range controls.

Behavior:

- Tapping a category opens that category's platform detail view.
- If amount hiding is enabled, money values show as masked text such as `CNY ****`.
- Trend shape can remain visible while amounts are hidden.

### Entry

The Entry page supports batch balance updates.

It shows platforms grouped by category. Each platform row includes:

- Platform name.
- Category.
- Current balance input.
- Optional note.

Saving updates platform balances and creates a snapshot for the current date. If a snapshot already exists for the current date, saving replaces that snapshot instead of creating a duplicate trend point.

### Add

The Add flow creates a new platform account.

Fields:

- Platform name.
- User-maintained category.
- Initial balance.
- Include in total.
- Optional note.

Negative asset behavior is controlled at the category level. A category such as credit cards, loans, or borrowing can be marked as negative. When the "deduct negative assets" setting is enabled, those category balances reduce total assets and snapshot totals.

### Stats

The Stats page shows category-level totals.

It should prioritize readable mobile lists and horizontal proportion bars over complex charts. Each category section shows:

- Category total.
- Share of total assets.
- Platform breakdown.

### Settings

The Settings page includes:

- Hide amounts toggle.
- Deduct negative assets toggle.
- Category management: add categories, rename categories, enable or disable categories, and mark whether a category is negative.
- Export JSON backup.
- Import JSON backup.
- Clear all local data.
- Currency display fixed to CNY for version 1.

Import validates the backup schema before replacing local data. Invalid imports must fail without overwriting existing data.

## Categories

The app uses two asset levels:

- Category, such as payment platforms, stocks, bank cards, loans, or credit cards.
- Platform/account under a category, such as WeChat and Alipay under payment platforms.

Both levels are user-maintained. The app ships with default categories:

- Bank Cards
- Payment Platforms
- Wealth Management
- Funds
- Stocks
- Credit Cards and Liabilities

Each category has an `isNegative` flag. When `isNegative` is true, the category is treated as a negative asset category. The global `deductNegativeAssets` setting controls whether those balances reduce dashboard totals and snapshot totals.

## Data Model

### Category

Each category has:

- `id`
- `name`
- `shortName`
- `icon`
- `isNegative`
- `active`
- `sortOrder`
- `createdAt`
- `updatedAt`

### Account

Each platform account has:

- `id`
- `name`
- `category`
- `balance`
- `includeInTotal`
- `note`
- `sortOrder`
- `createdAt`
- `updatedAt`

### Daily Snapshot

Each calendar date has at most one snapshot:

- `date`, in `YYYY-MM-DD`
- `totalAsset`
- `categoryTotals`
- `accountBalances`
- `categories`, preserving category name and negative-asset status at snapshot time
- `deductNegativeAssets`, preserving the setting used for that snapshot
- `createdAt`
- `updatedAt`

Snapshot totals include only accounts where `includeInTotal` is true. Negative-category accounts reduce the total only when `deductNegativeAssets` is true.

Historical snapshots keep their stored account balances even if an account is later deleted or disabled. This preserves the asset trend as it existed at the time.

### Settings

Settings include:

- `currency`, fixed to `CNY`
- `hideAmounts`
- `deductNegativeAssets`
- `lastBackupAt`
- `appVersion`

### Backup

Exported JSON includes:

- `schemaVersion`
- `exportedAt`
- `categories`
- `accounts`
- `snapshots`
- `settings`

Import checks `schemaVersion` and required fields before replacing local IndexedDB data.

## Visual Direction

The UI should reference the provided asset-summary screenshot but not copy its mini-program shell.

Direction:

- Obsidian green and mist-white surfaces.
- Light gray or white page background.
- Mint green for gains, muted pink for warning and negative emphasis, and subtle gold highlights.
- Large bold numeric hierarchy for money.
- Two-column category cards on the dashboard.
- Area line chart for asset trend.
- Fixed bottom navigation with a raised center add button.
- Stable masked amount widths to avoid layout jumps.

The interface should feel like a quiet personal finance dashboard, not a marketing landing page.

## OnePlus 12 Adaptation

Target the user's OnePlus 12 in portrait orientation.

Design assumptions:

- Long mobile viewport around 20:9.
- Primary testing around 1440 by 3168 proportions, with responsive CSS rather than hardcoded pixels.
- Bottom navigation respects safe-area padding.
- Main touch targets are at least 44 px high.
- No dedicated landscape layout in version 1.
- No app-store-grade multi-device compatibility requirement.

## Persistence Rules

- Data is stored locally on the phone through IndexedDB.
- The app works offline.
- Saving balances updates account records and upserts the current date snapshot.
- Deleting a platform removes it from current account management but does not rewrite historical snapshots.
- Disabled or non-total accounts remain visible but are excluded from total asset calculations.
- JSON export is the recovery path for reinstalling or switching phones.

## Error Handling

Expected error cases:

- Invalid numeric input: block save and show field-level feedback.
- Invalid backup file: reject import and preserve existing data.
- Unsupported backup schema version: reject import with an explanation.
- Empty state: show starter guidance and allow the user to add the first platform.
- Clear data: require confirmation before deleting local data.

## Testing And Verification

Functional checks:

- Add a platform and see it on dashboard, entry, and stats pages.
- Batch edit balances and verify total asset recalculation.
- Save twice on the same date and verify only one daily snapshot exists.
- Add negative liability balance and verify it reduces total assets.
- Toggle amount hiding and verify values are masked consistently.
- Export JSON and import it into a clean local state.
- Reject invalid JSON without data loss.

Visual checks:

- Dashboard fits the OnePlus 12 portrait viewport.
- Large amounts do not overflow.
- Bottom navigation does not cover content.
- Entry rows remain easy to tap and edit on mobile.
- Trend chart remains readable when manually zooming the recorded snapshot range.

Build checks:

- `npm.cmd run build`
- Capacitor sync after web build.
- Android debug APK build after Android SDK is installed.

## Delivery

Expected deliverables:

- Source project.
- Browser-previewable Vue app.
- Capacitor Android project.
- Debug APK once Android SDK is available.
- Short usage and build instructions.
