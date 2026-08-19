import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { PADS, EXTRA, STEMS, STEM_SECONDS } from './sampleBank';

const POOL_SIZE = { default: 3, hatClosed: 4, hatOpen: 3, shaker: 4, bass808: 2, chordMin: 2, chordMaj: 2 };

export default class SoundEngine {
  constructor() { this.pools = {}; this.stems = {}; this.allSounds = []; this.masterVolume = 0.85; this.rate = 1; this.loaded = false; this.disposed = false; this._stemMasterOffset = 0; }
  async loadAll(onProgress = () => {}) {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, staysActiveInBackground: false, playsInSilentModeIOS: true, shouldDuckAndroid: false, interruptionModeAndroid: InterruptionModeAndroid.DoNotMix, interruptionModeIOS: InterruptionModeIOS.DoNotMix, playThroughEarpieceAndroid: false });
    const total = PADS.length + Object.keys(EXTRA).length + STEMS.length * 2; let done = 0;
    const bump = (label) => { done += 1; onProgress(done, total, label); };
    for (const pad of PADS) { const voices = []; for (let i = 0; i < (POOL_SIZE[pad.id] ?? POOL_SIZE.default); i += 1) { const { sound } = await Audio.Sound.createAsync(pad.src, { shouldPlay: false, volume: this.masterVolume, rate: this.rate, shouldCorrectPitch: false }); voices.push(sound); this.allSounds.push(sound); } this.pools[pad.id] = { voices, idx: 0 }; bump(pad.label); }
    for (const [id, src] of Object.entries(EXTRA)) { const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false, volume: this.masterVolume, rate: this.rate, shouldCorrectPitch: false }); this.pools[id] = { voices: [sound], idx: 0 }; this.allSounds.push(sound); bump(id); }
    for (const stem of STEMS) { const mk = async (src) => { const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false, isLooping: true, volume: 0, rate: this.rate, shouldCorrectPitch: false }); this.allSounds.push(sound); return sound; }; const normal = await mk(stem.src); bump(stem.label); const lpf = await mk(stem.lpf); bump(`${stem.label} LPF`); this.stems[stem.id] = { normal, lpf, active: 'normal', playing: false, volume: 0.9 }; }
    this.loaded = true;
  }
  trigger(id, velocity = 1) { if (!this.loaded || this.disposed) return; const pool = this.pools[id]; if (!pool) return; const sound = pool.voices[pool.idx]; pool.idx = (pool.idx + 1) % pool.voices.length; sound.setStatusAsync({ shouldPlay: true, positionMillis: 0, volume: Math.max(0, Math.min(1, this.masterVolume * velocity)), rate: this.rate, shouldCorrectPitch: false }).catch(() => {}); }
  async setMasterVolume(v) { this.masterVolume = v; await Promise.all(this.allSounds.map((s) => s.setVolumeAsync(v).catch(() => {}))); }
  async setRate(v) { this.rate = v; await Promise.all(this.allSounds.map((s) => s.setRateAsync(v, false).catch(() => {}))); }
  async setStemActive(id, active) { const e = this.stems[id]; if (!e || this.disposed) return; const sound = e[e.active]; if (active) { e.playing = true; await sound.setStatusAsync({ shouldPlay: true, isLooping: true, positionMillis: this._currentStemPositionMs(), volume: e.volume * this.masterVolume, rate: this.rate, shouldCorrectPitch: false }).catch(() => {}); } else { e.playing = false; await sound.setStatusAsync({ shouldPlay: false, volume: 0 }).catch(() => {}); } }
  _currentStemPositionMs() { if (!this._stemMasterOffset) return 0; const loopMs = STEM_SECONDS * 1000; return (Date.now() - this._stemMasterOffset) % loopMs; }
  async setStemFilter(id, useLpf) { const e = this.stems[id]; if (!e) return; const target = useLpf ? 'lpf' : 'normal'; if (e.active === target) return; const from = e[e.active], to = e[target]; e.active = target; if (!e.playing) return; let pos = 0; try { const st = await from.getStatusAsync(); pos = st.positionMillis || 0; } catch {} await to.setStatusAsync({ shouldPlay: true, isLooping: true, positionMillis: pos, volume: e.volume * this.masterVolume, rate: this.rate, shouldCorrectPitch: false }).catch(() => {}); await from.setStatusAsync({ shouldPlay: false, volume: 0 }).catch(() => {}); }
  async setAllStemsFilter(v) { await Promise.all(Object.keys(this.stems).map((id) => this.setStemFilter(id, v))); }
  async silenceOneShots() { await Promise.all(Object.values(this.pools).flatMap((p) => p.voices.map((s) => s.stopAsync().catch(() => {})))); }
  async dispose() { if (this.disposed) return; this.disposed = true; await Promise.all(this.allSounds.map((s) => s.unloadAsync().catch(() => {}))); this.allSounds = []; this.pools = {}; this.stems = {}; this.loaded = false; }
}
