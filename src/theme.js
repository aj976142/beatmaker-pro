/**
 * theme.js — Neon / MPC-inspired dark design tokens.
 */

export const C = {
  bg: '#07070C', bgElev: '#0E0E17', panel: '#12121D', panelHi: '#1A1A2A', line: '#242438', lineHi: '#33334D',
  text: '#ECECF5', textDim: '#8B8BA7', textFaint: '#5A5A72', cyan: '#00F0FF', magenta: '#FF2D95', lime: '#B6FF00', amber: '#FFB020', violet: '#9D5CFF', red: '#FF3B5C', white: '#FFFFFF', black: '#000000',
};
export const GROUP = { kick: C.magenta, snare: C.amber, hat: C.cyan, perc: C.lime, bass: C.violet, synth: C.cyan, fx: C.red };
export const RADIUS = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };
export const SPACE = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24 };
export const glow = (color, intensity = 1) => ({ shadowColor: color, shadowOpacity: 0.85 * intensity, shadowRadius: 16 * intensity, shadowOffset: { width: 0, height: 0 }, elevation: 12 * intensity });
export const FONT = { mono: undefined };
