# Show Me The Money

Personal offline asset dashboard app for side-loaded Android use.

## What It Does

- Tracks balances by custom category and platform, such as payment platforms > Alipay / WeChat.
- Supports adding, renaming, enabling, disabling, and marking categories as negative assets.
- Provides a setting to decide whether negative asset categories are deducted from total assets and snapshots.
- Keeps category management and visual theme selection in secondary Settings pages.
- Includes five selectable visual themes: classic gray, obsidian green, deep sea blue, moon purple gray, and cafe gold.
- Saves one daily asset snapshot when balances are saved.
- Shows total assets, editable category summaries, and asset trend charts.
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

Use JDK 21 for the local Gradle build. Newer JDKs can fail with errors such as `Unsupported class file major version 68`.

On this machine, the working local paths are:

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:ANDROID_HOME = "E:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "E:\Android\Sdk"
```

Create `android/local.properties` if it does not exist:

```properties
sdk.dir=E\:\\Android\\Sdk
```

Build the debug APK:

```powershell
npm.cmd run build
npx.cmd cap sync android
cd android
.\gradlew.bat assembleDebug
```

If Maven Central or the Gradle plugin portal is unstable on the current network, use the repository mirror init script:

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
$env:ANDROID_HOME = "E:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "E:\Android\Sdk"
cd android
.\gradlew.bat --init-script maven-mirror.init.gradle assembleDebug
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

