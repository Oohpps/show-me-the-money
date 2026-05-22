# Release Notes 1.1.0

Date: 2026-05-22

## Highlights

- Rebuilt the app UI in a Bauhaus / neo-brutalist visual style.
- Removed the standalone Add tab; the bottom navigation now has Assets, Entry, Stats, and Settings.
- Added a custom styled entry-date control and snapshot saving by selected date.
- Changed default categories to Bank Cards, Payment Platforms, Stocks, Cash, and Liabilities.
- Updated negative-asset behavior so liability balances are entered as positive numbers and deducted by category rules.
- Added total trend details, category trend details, and platform trend charts.
- Added Android native back support for secondary and nested pages.
- Added five Bauhaus-compatible theme options.
- Produced an installable debug APK at `release/show-me-the-money-1.1.0-debug.apk`.

## Build Notes

- Version name: `1.1.0`
- Android version code: `3`
- Package id: `com.oohpps.showmethemoney`
- Compile SDK: `35`
- Minimum SDK: `23`
- Target SDK: `35`

The local APK build used project-local tools under `.local-tools/` and domestic mirrors for Android SDK and Gradle downloads. Generated tools and APKs are ignored by git.
