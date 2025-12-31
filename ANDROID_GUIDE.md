# Android Application Build Guide

This document captures the successful configuration and process used to convert the "Agenda Builder" React web application into a fully functional Android APK.

## 1. Project Architecture

The application is built using:
-   **Framework**: React + Vite
-   **Styling**: Tailwind CSS (with responsive design adaptations)
-   **Mobile Runtime**: Capacitor (v7/v8)
-   **Build System**: GitHub Actions (Cloud-based build, no local Android Studio required)

## 2. Key Configurations

### Vite Configuration (`vite.config.js`)
To ensure the app loads correctly within the Android WebView (which serves files from `file://` protocol), the base path must be set to relative:

```javascript
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Allows assets to load with relative paths
})
```

### Router Configuration (`src/App.jsx`)
The application uses `HashRouter` instead of `BrowserRouter`. This is essential for:
1.  **Capacitor**: Native apps often don't support history pushState routing perfectly without server config.
2.  **GitHub Pages**: Does not natively support single-page app routing (SPA) without a hack. `HashRouter` works out of the box.

```javascript
import { HashRouter as Router, ... } from 'react-router-dom';
```

### Capacitor Configuration (`capacitor.config.json`)
Basic setup linking the web build directory (`dist`) to the native shell:

```json
{
  "appId": "com.agendabox.app",
  "appName": "Dynamic Agenda",
  "webDir": "dist"
}
```

### Responsive Design Adaptations
To ensure the app works on mobile screens (vertical layout), the following changes were made:
-   **Mobile-First Layouts**: Converted horizontal `flex-row` layouts to `flex-col` on small screens (e.g., Headers, Event Cards).
-   **Overflow Handling**: Added `break-words` and `flex-wrap` to prevent text and buttons from spilling off-screen.
-   **Touch Targets**: Increased padding for buttons to make them tap-friendly.

## 3. Automation: GitHub Actions Build Workflow

We use **GitHub Actions** to build the APK automatically. This removes the need to install Android Studio locally.

**Workflow File**: `.github/workflows/android_build.yml`

```yaml
name: Build Android APK

on:
  push:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Install Dependencies
        run: npm install

      - name: Build Web App
        run: npm run build

      - name: Set up JDK 21
        uses: actions/setup-java@v4
        with:
          java-version: '21'
          distribution: 'zulu'

      - name: Capacitor Sync
        run: npx cap sync

      - name: Build Android APK
        run: |
          cd android
          gradle assembleDebug

      - name: Upload APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: Dynamic-Agenda-debug.apk
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

## 4. How to Build a New Version

1.  **Make Changes**: Edit your React code.
2.  **Commit & Push**:
    ```bash
    git add .
    git commit -m "Your update message"
    git push origin main
    ```
3.  **Wait**: Go to the **Actions** tab in your GitHub repository.
4.  **Download**: Click on the latest workflow run. The built APK (`Dynamic-Agenda-debug.apk`) will be available under the **Artifacts** section at the bottom.

## 5. Troubleshooting History

-   **Issue**: 404 Errors on deployment.
    -   **Fix**: Ensured `vite.config.js` has `base: './'` and a build workflow is present.
-   **Issue**: Buttons hidden/overflowing on mobile.
    -   **Fix**: Applied `flex-wrap` and `flex-col` classes in Tailwind to key components (`Dashboard.jsx`, `EventBuilder.jsx`).
-   **Issue**: iOS usage.
    -   **Action**: Completely removed `ios` folder and dependencies to focus solely on Android/Web.
