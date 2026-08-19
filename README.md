# BeatForge — Android + Windows Beat Studio

BeatForge is a mobile-first beat maker built with Expo/React Native. The same project can run natively on Android and can be packaged as a Windows desktop application through an Electron shell around the Expo web build.

## Platforms

- **Android:** Expo / React Native native app, with a release APK build in GitHub Actions.
- **Windows:** Electron desktop app using the Expo web build, with both an NSIS installer and portable `.exe` artifact.

## Run on Android

```bash
npm install
npm run samples
npx expo start --android
```

For a native release build locally:

```bash
npm run samples
npx expo prebuild --platform android --clean
npx expo run:android --variant release
```

## Run on Windows

Windows development requires Node.js and Python 3.10+.

```powershell
npm install
npm run windows
```

This generates the sample bank, exports the Expo web app, and opens BeatForge in Electron.

Build a Windows installer and portable executable:

```powershell
npm run windows:dist
```

Artifacts are written to `release/`.

## Audio assets

The repository does not need to store generated WAV binaries. `scripts/gen_samples.py` creates the 26 required sounds locally using Python's standard library. This keeps the Git repository small and makes clean Android/Windows builds reproducible.

## GitHub builds

Pushes to `main` run project checks. The Android and Windows workflows can also be started from **Actions → Run workflow**.

- **Android workflow:** generates the audio bank, creates the native Android project, builds a release APK with Gradle, and uploads it as an artifact.
- **Windows workflow:** generates the audio bank, exports the web app, builds an NSIS installer and a portable `.exe`, and uploads both.

## Current feature set

- 16 performance pads
- 16-step / 4-track sequencer
- BPM slider and tap tempo
- master volume and playback rate
- beat-synced loop stems
- LPF, echo, riser and vinyl FX
- pooled audio voices for overlapping hits
- drift-compensated sequencer scheduler
- Android native build
- Windows desktop packaging
