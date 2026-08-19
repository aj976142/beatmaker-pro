export const PADS = [
  { id: 'kick808', label: '808 KICK', group: 'kick', key: 'A1', src: require('../../assets/samples/kick_808.wav') },
  { id: 'kickPunch', label: 'PUNCH', group: 'kick', key: 'A2', src: require('../../assets/samples/kick_punch.wav') },
  { id: 'snare', label: 'SNARE', group: 'snare', key: 'A3', src: require('../../assets/samples/snare.wav') },
  { id: 'clap', label: 'CLAP', group: 'snare', key: 'A4', src: require('../../assets/samples/clap.wav') },
  { id: 'hatClosed', label: 'HAT CL', group: 'hat', key: 'B1', src: require('../../assets/samples/hat_closed.wav') },
  { id: 'hatOpen', label: 'HAT OP', group: 'hat', key: 'B2', src: require('../../assets/samples/hat_open.wav') },
  { id: 'shaker', label: 'SHAKER', group: 'perc', key: 'B3', src: require('../../assets/samples/shaker.wav') },
  { id: 'rimshot', label: 'RIM', group: 'perc', key: 'B4', src: require('../../assets/samples/rimshot.wav') },
  { id: 'tomLow', label: 'TOM LO', group: 'perc', key: 'C1', src: require('../../assets/samples/tom_low.wav') },
  { id: 'tomMid', label: 'TOM MID', group: 'perc', key: 'C2', src: require('../../assets/samples/tom_mid.wav') },
  { id: 'bass808', label: 'BASS 808', group: 'bass', key: 'C3', src: require('../../assets/samples/bass_808.wav') },
  { id: 'bassSlide', label: 'SLIDE', group: 'bass', key: 'C4', src: require('../../assets/samples/bass_slide.wav') },
  { id: 'chordMin', label: 'CHORD m', group: 'synth', key: 'D1', src: require('../../assets/samples/synth_chord_min.wav') },
  { id: 'chordMaj', label: 'CHORD M', group: 'synth', key: 'D2', src: require('../../assets/samples/synth_chord_maj.wav') },
  { id: 'stab', label: 'STAB', group: 'synth', key: 'D3', src: require('../../assets/samples/synth_stab.wav') },
  { id: 'fxDrop', label: 'FX DROP', group: 'fx', key: 'D4', src: require('../../assets/samples/fx_drop.wav') },
];
export const EXTRA = { fxRiser: require('../../assets/samples/fx_riser.wav'), vinylStop: require('../../assets/samples/vinyl_stop.wav') };
export const STEM_BPM = 120;
export const STEM_BARS = 2;
export const STEM_SECONDS = 4.0;
export const STEMS = [
  { id: 'drums', label: 'DRUMS', group: 'kick', src: require('../../assets/samples/loop_drums.wav'), lpf: require('../../assets/samples/loop_drums_lpf.wav') },
  { id: 'bass', label: 'BASSLINE', group: 'bass', src: require('../../assets/samples/loop_bass.wav'), lpf: require('../../assets/samples/loop_bass_lpf.wav') },
  { id: 'melody', label: 'MELODY', group: 'synth', src: require('../../assets/samples/loop_melody.wav'), lpf: require('../../assets/samples/loop_melody_lpf.wav') },
  { id: 'vocal', label: 'VOX CHOP', group: 'fx', src: require('../../assets/samples/loop_vocal.wav'), lpf: require('../../assets/samples/loop_vocal_lpf.wav') },
];
export const SEQ_TRACKS = [
  { id: 'kick', label: 'KICK', padId: 'kick808', group: 'kick' },
  { id: 'snare', label: 'SNARE', padId: 'snare', group: 'snare' },
  { id: 'hat', label: 'HAT', padId: 'hatClosed', group: 'hat' },
  { id: 'synth', label: 'SYNTH', padId: 'stab', group: 'synth' },
];
const pad64 = (arr) => [...arr, ...new Array(64 - arr.length).fill(0)];
export const DEFAULT_PATTERN = {
  kick: pad64([1,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0]),
  snare: pad64([0,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0]),
  hat: pad64([1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,1]),
  synth: pad64([0,0,0,0,0,0,0,0,1,0,0,0,0,0,1,0]),
};
export const STEPS = 64;
export const TOTAL_ASSETS = PADS.length + Object.keys(EXTRA).length + STEMS.length * 2;
