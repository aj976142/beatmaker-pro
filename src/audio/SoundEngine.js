import { Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { PADS, EXTRA, STEMS, STEM_SECONDS } from './sampleBank';

const POOL_SIZE = { default: 3, hatClosed: 4, hatOpen: 3, shaker: 4, bass808: 2, chordMin: 2, chordMaj: 2 };

export default class SoundEngine {
  constructor() { this.pools = {}; this.stems = {}; this.allSounds = []; this.masterVolume = 0.85; this.rate = 1; this.groupVolumes = { kick: 1, snare: 1, hat: 1, synth: 1, perc: 1, bass: 1, fx: 1 }; this.loaded = false; this.disposed = false; this._stemMasterOffset = 0; }
  async loadAll(onProgress = () => {}) {
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, staysActiveInBackground: false, playsInSilentModeIOS: true, shouldDuckAndroid: false, interruptionModeAndroid: InterruptionModeAndroid.DoNotMix, interruptionModeIOS: InterruptionModeIOS.DoNotMix, playThroughEarpieceAndroid: false });
    const total = PADS.length + Object.keys(EXTRA).length + STEMS.length * 2; let done = 0;
    const bump = (label) => { done += 1; onProgress(done, total, label); };
    for (const pad of PADS) { if (this.disposed) return this.dispose(); const voices = []; for (let i = 0; i < (POOL_SIZE[pad.id] ?? POOL_SIZE.default); i += 1) { const { sound } = await Audio.Sound.createAsync(pad.src, { shouldPlay: false, volume: this.masterVolume * (this.groupVolumes[pad.group] ?? 1), rate: this.rate, shouldCorrectPitch: false }); voices.push(sound); this.allSounds.push(sound); } this.pools[pad.id] = { voices, idx: 0, group: pad.group || 'fx' }; bump(pad.label); }
    for (const [id, src] of Object.entries(EXTRA)) { if (this.disposed) return this.dispose(); const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false, volume: this.masterVolume, rate: this.rate, shouldCorrectPitch: false }); this.pools[id] = { voices: [sound], idx: 0, group: 'fx' }; this.allSounds.push(sound); bump(id); }
    for (const stem of STEMS) { if (this.disposed) return this.dispose(); const mk = async (src) => { const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false, isLooping: true, volume: 0, rate: this.rate, shouldCorrectPitch: false }); this.allSounds.push(sound); return sound; }; const normal = await mk(stem.src); bump(stem.label); const lpf = await mk(stem.lpf); bump(`${stem.label} LPF`); this.stems[stem.id] = { normal, lpf, active: 'normal', playing: false, volume: 0.9 }; }
    if (this.disposed) { await this.dispose(); return; }
    this.loaded = true;
  }
  trigger(id, velocity = 1) { if (!this.loaded || this.disposed) return; const pool = this.pools[id]; if (!pool) return; const sound = pool.voices[pool.idx]; pool.idx = (pool.idx + 1) % pool.voices.length; const groupVolume = this.groupVolumes[pool.group] ?? 1; sound.setStatusAsync({ shouldPlay: true, positionMillis: 0, volume: Math.max(0, Math.min(1, this.masterVolume * groupVolume * velocity)), rate: this.rate, shouldCorrectPitch: false }).catch(() => {}); }
  async setMasterVolume(v) { this.masterVolume = v; await Promise.all(Object.entries(this.pools).flatMap(([id, p]) => p.voices.map((s) => s.setVolumeAsync(this.masterVolume * (this.groupVolumes[p.group] ?? 1)).catch(() => {}))).concat(Object.values(this.stems).map((e) => e[e.active].setVolumeAsync(e.playing ? e.volume * this.masterVolume : 0).catch(() => {})))); }
  async setGroupVolume(group, v) { this.groupVolumes[group] = Math.max(0, Math.min(1, Number(v) || 0)); const target = this.masterVolume * this.groupVolumes[group]; const pools = Object.values(this.pools).filter((p) => p.group === group); await Promise.all(pools.flatMap((p) => p.voices.map((s) => s.setVolumeAsync(target).catch(() => {})))); }
  async setRate(v) { this.rate = v; await Promise.all(this.allSounds.map((s) => s.setRateAsync(v, false).catch(() => {}))); }
  async setStemActive(id, active) { const e = this.stems[id]; if (!e || this.disposed) return; if (!!active === e.playing) return; const sound = e[e.active]; if (active) { this._ensureStemClock(); e.playing = true; await sound.setStatusAsync({ shouldPlay: true, isLooping: true, positionMillis: this._currentStemPositionMs(), volume: e.volume * this.masterVolume, rate: this.rate, shouldCorrectPitch: false }).catch(() => {}); } else { e.playing = false; await sound.setStatusAsync({ shouldPlay: false, volume: 0 }).catch(() => {}); this._releaseStemClockIfIdle(); } }
  /** Anchor the shared stem loop clock. Called when the first stem starts. */
  _ensureStemClock() { if (!this._stemMasterOffset) this._stemMasterOffset = Date.now(); }
  /** Release the clock once nothing is looping so the next stem starts at 0. */
  _releaseStemClockIfIdle() { if (!Object.values(this.stems).some((e) => e.playing)) this._stemMasterOffset = 0; }
  _currentStemPositionMs() { if (!this._stemMasterOffset) return 0; const loopMs = STEM_SECONDS * 1000; return (Date.now() - this._stemMasterOffset) % loopMs; }
  async setStemFilter(id, useLpf) { const e = this.stems[id]; if (!e) return; const target = useLpf ? 'lpf' : 'normal'; if (e.active === target) return; const from = e[e.active], to = e[target]; e.active = target; if (!e.playing) return; let pos = 0; try { const st = await from.getStatusAsync(); pos = st.positionMillis || 0; } catch {} await to.setStatusAsync({ shouldPlay: true, isLooping: true, positionMillis: pos, volume: e.volume * this.masterVolume, rate: this.rate, shouldCorrectPitch: false }).catch(() => {}); await from.setStatusAsync({ shouldPlay: false, volume: 0 }).catch(() => {}); }
  async setAllStemsFilter(v) { await Promise.all(Object.keys(this.stems).map((id) => this.setStemFilter(id, v))); }
  async silenceOneShots() { await Promise.all(Object.values(this.pools).flatMap((p) => p.voices.map((s) => s.stopAsync().catch(() => {})))); }
  async dispose() { if (this.disposed && !this.allSounds.length) return; this.disposed = true; await Promise.all(this.allSounds.map((s) => s.unloadAsync().catch(() => {}))); this.allSounds = []; this.pools = {}; this.stems = {}; this.loaded = false; }
}
