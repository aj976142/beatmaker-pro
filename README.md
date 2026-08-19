# BeatForge

BeatForge is a cross-platform beat-making studio built with Expo / React Native, with an Electron Windows desktop shell.

## Current features

- 16 performance pads
- 16-step sequencer with 4 tracks
- BPM + tap tempo
- Master volume and pitch/speed controls
- Beat-synced loop stems
- Filter, echo, riser and brake FX
- Local project library
- Save / load / rename / delete projects
- Automatic local project saving after edits
- Android APK build configuration
- Windows installer + portable build configuration

## Project data

Projects are stored locally on the device/desktop using AsyncStorage. Saved projects contain the beat pattern, mute states, BPM, mixer settings, stems and FX state.

## Development

```bash
npm install
npm run start
```

Android:

```bash
npm run android
```

Windows:

```bash
npm run windows
```

Windows installers:

```bash
npm run windows:dist
```

APK build:

```bash
npm run build:apk
```
