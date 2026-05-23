# Show Me The Money

Personal offline asset dashboard app for side-loaded Android use.

Current release: `1.1.4`.

## What It Does

- Tracks balances by custom category and platform, such as bank cards, payment platforms, stocks, cash, and liabilities.
- Uses a Bauhaus / neo-brutalist mobile UI with high-contrast blocks, hard borders, and large numeric hierarchy.
- Supports category and platform management from Settings, including edit, delete, disable, and negative-asset categories.
- Provides a setting to decide whether negative asset categories are deducted from total assets and snapshots.
- Negative-asset balances are entered as positive numbers; subtraction is applied by category semantics.
- Saves one daily asset snapshot for the selected entry date.
- Shows total assets, category summaries, total trend details, category trend details, and platform trend charts.
- Supports Android native back behavior for secondary and nested pages.
- Includes five Bauhaus-compatible visual themes.
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

The web app is Capacitor-ready. Android APK generation requires JDK 21 and Android SDK 35.

This repository keeps generated SDK/JDK tools and APK files out of git:

- `.local-tools/`
- `release/*.apk`

The local packaging setup used for `1.1.4` is:

```powershell
$env:JAVA_HOME = "E:\show-me-the-money\.local-tools\openjdk21\jdk-21.0.11+10"
$env:ANDROID_HOME = "E:\show-me-the-money\.local-tools\android-sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
```

Create `android/local.properties` if it does not exist. For this local SDK:

```properties
sdk.dir=E\:\\show-me-the-money\\.local-tools\\android-sdk
```

Build and sync Capacitor:

```powershell
npm.cmd run cap:sync
```

Build the installable debug APK with the mirror init script:

```powershell
cd android
.\gradlew.bat -I maven-mirror.init.gradle assembleDebug
```

The debug APK will be under:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

For release `1.1.4`, the copied installable APK path is:

```text
release/show-me-the-money-1.1.4-debug.apk
```

Install it on Android by enabling side-loading and opening the APK file on the phone.

## Backup And Restore

Open Settings in the app:

- Use Export JSON to create a backup.
- Save the JSON somewhere outside the app before reinstalling.
- Paste a valid backup into Import JSON to restore accounts, snapshots, and settings.

