# BeatForge — Android + Windows Beat Studio

BeatForge is a mobile-first beat maker built with Expo/React Native. The same project can run natively on Android and can be packaged as a Windows desktop application through an Electron shell around the Expo web build.

## Platforms

- Android native app with a release APK workflow.
- Windows desktop app with NSIS installer and portable EXE workflows.

## Android

```bash
npm install
npm run samples
npx expo start --android
```

Release build:

```bash
npm run samples
npx expo prebuild --platform android --clean
npx expo run:android --variant release
```

## Windows

```powershell
npm install
npm run windows
```

Build installer + portable EXE:

```powershell
npm run windows:dist
```

## Audio assets

The generated 26-file WAV bank is created by `scripts/gen_samples.py` using Python's standard library, so the repository stays small and clean builds can recreate the audio assets.

## GitHub Actions

- Android: generates samples, runs Expo prebuild, builds a release APK with Gradle, and uploads it as an artifact.
- Windows: generates samples, exports the Expo web build, packages Electron as an NSIS installer and portable EXE, and uploads both.
- Preflight: generates samples and verifies the Expo web bundle and scheduler syntax.

## Features

16 pads, 16-step / 4-track sequencer, BPM/tap tempo, volume, playback rate, beat-synced stems, LPF, echo, riser, vinyl FX, pooled voices, and drift-compensated scheduling.
