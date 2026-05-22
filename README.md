# Show Me The Money

Personal offline asset dashboard app for side-loaded Android use.

## What It Does

- Tracks balances by custom category and platform, such as payment platforms > Alipay / WeChat.
- Supports adding, renaming, enabling, disabling, and marking categories as negative assets.
- Provides a setting to decide whether negative asset categories are deducted from total assets and snapshots.
- Saves one daily asset snapshot when balances are saved.
- Shows total assets, fixed category summaries, and asset trend charts.
- Supports amount hiding for privacy.
- Exports and imports JSON backups.
- Stores data locally with IndexedDB. There is no login, server, cloud sync, or automatic bank integration.

## Stack

- Vue 3
- TypeScript
- Vite
- Vitest
- Capacitor Android

## Development

```powershell
npm.cmd install
npm.cmd run dev -- --host 127.0.0.1
```

## Checks

```powershell
npm.cmd test -- --run
npm.cmd run build
```

## Android Packaging

The web app is Capacitor-ready. Android APK generation requires Android Studio or Android SDK.

After Android SDK is installed:

```powershell
npm.cmd run build
npx cap sync android
cd android
.\gradlew assembleDebug
```

The debug APK will be under:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

Install it on the OnePlus 12 by enabling Android side-loading and opening the APK file on the phone.

## Backup And Restore

Open Settings in the app:

- Use Export JSON to create a backup.
- Save the JSON somewhere outside the app before reinstalling.
- Paste a valid backup into Import JSON to restore accounts, snapshots, and settings.

