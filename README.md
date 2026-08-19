# BeatForge — Android + Windows Beat Studio

BeatForge is a mobile-first beat maker built with Expo/React Native. The same project can run natively on Android and can be packaged as a Windows desktop application through an Electron shell around the Expo web build.

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

Build the NSIS installer and portable EXE:

```powershell
npm run windows:dist
```

## Audio assets

`scripts/gen_samples.py` creates the 26 required WAV files locally with Python's standard library. This keeps the Git repository small and makes clean builds reproducible.

## GitHub Actions

Android and Windows workflows generate the audio bank and build downloadable artifacts. The preflight workflow checks the scheduler syntax and Expo web bundle.

## Features

16 pads, 16-step / 4-track sequencer, BPM/tap tempo, volume, playback rate, beat-synced stems, LPF, echo, riser, vinyl FX, pooled audio voices, and drift-compensated scheduling.
