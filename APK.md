# PocketLLM APK

The APK file is located at:
`android/app/build/outputs/apk/release/app-release.apk`

## Build Instructions

### Prerequisites
- Node.js 18+, npm
- JDK 17+
- Android Studio with SDK 24+

### Steps
```bash
cd D:\PocketLLM
npm install --legacy-peer-deps

cd android
gradlew assembleRelease
```

The APK will be at `android/app/build/outputs/apk/release/app-release.apk`
