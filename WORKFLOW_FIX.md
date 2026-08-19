# Android APK workflow — the last blocker

The source bugs are fixed and merged. `main` now bundles cleanly and
`BeatForge CI` / `Project checks` are green.

The **Android APK** job still fails, but no longer for a code reason: it dies
after ~8 seconds in the `Set up Java 17` step, before installing a single
dependency.

I could not push this fix myself — the Arena GitHub App token lacks the
`workflows` permission, so any commit touching `.github/workflows/**` is
rejected:

```
refusing to allow a GitHub App to create or update workflow
`.github/workflows/android.yml` without `workflows` permission
```

Either grant that permission (then ask me to push), or apply the change below
by hand.

---

## Required fix (one line)

In `.github/workflows/android.yml`, delete the `cache: gradle` line:

```diff
       - name: Set up Java 17
         uses: actions/setup-java@v4
         with:
           distribution: temurin
           java-version: '17'
-          cache: gradle
```

### Why it fails

`setup-java`'s `cache: gradle` scans the checkout for
`**/*.gradle*`, `**/gradle-wrapper.properties`, etc. to build a cache key.

This project has **no `android/` directory in Git** — it is generated later in
the job by `expo prebuild`. So at the moment `setup-java` runs there is nothing
to hash, and the step hard-fails:

```
No file in /home/runner/work/beatmaker-pro/beatmaker-pro matched to
[**/*.gradle*,**/gradle-wrapper.properties,...], make sure you have checked out
the target repository
```

Removing the option lets the job proceed. Gradle caching can be added back
*after* the prebuild step using `actions/cache` (see the optional version
below), which is where the Gradle files actually exist.

---

## Optional: fuller version

Beyond the one-line fix, this adds a fast bundle check, real Gradle caching,
APK validation and a downloadable release. The critical part is the
`Validate Android JS bundle` step — Gradle runs that exact Metro bundle during
`:app:bundleReleaseJsAndAssets`, so a broken bundle currently fails ~16 minutes
into the native build instead of in ~30 seconds.

```yaml
name: Android APK

on:
  workflow_dispatch:
  push:
    branches: [main]
  pull_request:
    branches: [main]

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up Java 17
        uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: '17'

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.19.5

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: npm install --legacy-peer-deps --no-audit --no-fund

      - name: Normalize Expo SDK dependencies
        run: npx expo install --fix --npm

      - name: Generate audio samples
        run: npm run samples

      - name: Tests
        run: npm test

      # Fail in seconds instead of ~16 minutes deep inside Gradle when the
      # JavaScript bundle is broken.
      - name: Validate Android JS bundle
        run: npx expo export --platform android --output-dir "$RUNNER_TEMP/android-bundle-check"

      - name: Generate Android project
        run: npx expo prebuild --platform android --clean --non-interactive

      # Cache AFTER prebuild, when the gradle files actually exist.
      - name: Cache Gradle
        uses: actions/cache@v4
        with:
          path: |
            ~/.gradle/caches
            ~/.gradle/wrapper
          key: gradle-${{ runner.os }}-${{ hashFiles('android/**/*.gradle*', 'android/gradle/wrapper/gradle-wrapper.properties') }}
          restore-keys: |
            gradle-${{ runner.os }}-

      - name: Make Gradle executable
        working-directory: android
        run: chmod +x gradlew

      - name: Build release APK
        working-directory: android
        run: ./gradlew assembleRelease --no-daemon --stacktrace

      - name: Stage APK
        id: stage
        run: |
          set -euo pipefail
          version=$(node -p "require('./package.json').version")
          src=$(find android/app/build/outputs/apk/release -name '*.apk' | head -1)
          test -n "$src"
          mkdir -p artifacts
          cp "$src" "artifacts/BeatForge-${version}.apk"
          echo "apk=artifacts/BeatForge-${version}.apk" >> "$GITHUB_OUTPUT"
          echo "version=${version}" >> "$GITHUB_OUTPUT"
          ls -lh artifacts

      - name: Verify APK is a valid package
        run: |
          set -euo pipefail
          unzip -l "${{ steps.stage.outputs.apk }}" | grep -q AndroidManifest.xml
          unzip -l "${{ steps.stage.outputs.apk }}" | grep -q classes.dex
          echo "APK looks structurally valid."

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: beatforge-android-apk
          path: artifacts/*.apk
          if-no-files-found: error

      - name: Publish release
        if: github.event_name != 'pull_request'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          set -euo pipefail
          gh release create "android-build-${{ github.run_number }}" \
            "${{ steps.stage.outputs.apk }}" \
            --title "BeatForge ${{ steps.stage.outputs.version }} (build ${{ github.run_number }})" \
            --notes "Debug-signed Android APK built from ${{ github.sha }}. Enable installs from unknown sources to sideload." \
            --target "${{ github.sha }}"
```

## Note on signing

`assembleRelease` here produces a **debug-signed** APK. That is fine for
sideloading, but Google Play will reject it. Publishing needs a real keystore
stored in repository secrets and wired into `android/app/build.gradle`.
