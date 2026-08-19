/** BeatForge cross-platform mobile + Windows beat-maker studio. */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AudioWaveform, Grid3x3, Disc3 } from 'lucide-react-native';
import { C, RADIUS, SPACE } from './src/theme';
import { PADS, SEQ_TRACKS, STEPS, DEFAULT_PATTERN, STEM_BPM } from './src/audio/sampleBank';
import useSoundEngine from './src/hooks/useSoundEngine';
import useTransport from './src/hooks/useTransport';
import Pad from './src/components/Pad';
import Sequencer from './src/components/Sequencer';
import LoadingScreen from './src/components/LoadingScreen';
import ProjectBar from './src/components/ProjectBar';
import TrackMixer from './src/components/TrackMixer';
import { saveProject } from './src/storage/projects';
import { Transport, BpmSlider, VolumeSlider, RateSlider, StemBar, FxBar } from './src/components/Controls';

const clonePattern = (p) => Object.fromEntries(Object.entries(p).map(([k, v]) => [k, [...v]]));
const emptyPattern = () => Object.fromEntries(SEQ_TRACKS.map((t) => [t.id, new Array(STEPS).fill(0)]));
const DEFAULT_TRACK_VOLUMES = { kick: 1, snare: 1, hat: 1, synth: 1 };

function Studio() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { engine, ready, progress, error, trigger } = useSoundEngine();
  const [pattern, setPattern] = useState(() => clonePattern(DEFAULT_PATTERN));
  const [sequenceLength, setSequenceLength] = useState(16);
  const [swing, setSwing] = useState(0);
  const [mutes, setMutes] = useState({});
  const [trackVolumes, setTrackVolumes] = useState(DEFAULT_TRACK_VOLUMES);
  const [volume, setVolume] = useState(0.85);
  const [rate, setRate] = useState(1);
  const [activeStems, setActiveStems] = useState({});
  const [lpf, setLpf] = useState(false);
  const [echo, setEcho] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [projectName, setProjectName] = useState('Unsaved Beat');
  const [hydrated, setHydrated] = useState(false);

  const patternRef = useRef(pattern); patternRef.current = pattern;
  const mutesRef = useRef(mutes); mutesRef.current = mutes;
  const readyRef = useRef(ready); readyRef.current = ready;

  const onStepFired = useCallback((step) => {
    if (!readyRef.current || step >= sequenceLength) return;
    const pat = patternRef.current, mut = mutesRef.current;
    for (let i = 0; i < SEQ_TRACKS.length; i += 1) {
      const track = SEQ_TRACKS[i];
      if (!mut[track.id] && pat[track.id][step]) trigger(track.padId, step % 4 === 0 ? 1 : 0.82);
    }
  }, [trigger, sequenceLength]);
  const { bpm, setBpm, playing, toggle, stop, currentStep, tapTempo, tapCount } = useTransport({ onStepFired, stepsPerLoop: sequenceLength, swing });

  const handleVolume = useCallback((v) => { setVolume(v); engine.current?.setMasterVolume(v); }, [engine]);
  const handleRate = useCallback((v) => { setRate(v); engine.current?.setRate(v); }, [engine]);
  const handleTrackVolume = useCallback((trackId, value) => {
    setTrackVolumes((prev) => ({ ...prev, [trackId]: value }));
    const track = SEQ_TRACKS.find((t) => t.id === trackId);
    if (track) engine.current?.setGroupVolume(track.group, value);
  }, [engine]);
  const toggleStem = useCallback((id) => setActiveStems((prev) => ({ ...prev, [id]: !prev[id] })), []);
  const toggleLpf = useCallback(() => setLpf((prev) => !prev), []);

  const echoRef = useRef(echo); echoRef.current = echo;
  const echoTimers = useRef([]), bpmRef = useRef(bpm); bpmRef.current = bpm;
  const triggerPad = useCallback((id) => {
    trigger(id, 1);
    if (echoRef.current) {
      const eighth = (60 / bpmRef.current / 2) * 1000;
      [{ d: eighth, v: 0.42 }, { d: eighth * 2, v: 0.18 }].forEach(({ d, v }) => echoTimers.current.push(setTimeout(() => trigger(id, v), d)));
      if (echoTimers.current.length > 64) echoTimers.current = echoTimers.current.slice(-64);
    }
  }, [trigger]);
  useEffect(() => () => { echoTimers.current.forEach(clearTimeout); echoTimers.current = []; }, []);

  useEffect(() => {
    if (!ready) return;
    engine.current?.setMasterVolume(volume);
    engine.current?.setRate(rate);
    engine.current?.setAllStemsFilter(lpf);
    SEQ_TRACKS.forEach((track) => engine.current?.setGroupVolume(track.group, trackVolumes[track.id] ?? 1));
    Object.entries(activeStems).forEach(([id, active]) => engine.current?.setStemActive(id, !!active));
  }, [ready, engine, volume, rate, lpf, activeStems, trackVolumes]);

  const fireRiser = useCallback(() => trigger('fxRiser', 1), [trigger]);
  const fireVinyl = useCallback(() => trigger('vinylStop', 1), [trigger]);
  const toggleStep = useCallback((trackId, index) => setPattern((prev) => { const next = clonePattern(prev); next[trackId][index] = next[trackId][index] ? 0 : 1; return next; }), []);
  const toggleMute = useCallback((trackId) => setMutes((prev) => ({ ...prev, [trackId]: !prev[trackId] })), []);
  const clearPattern = useCallback(() => setPattern(emptyPattern()), []);
  const randomPattern = useCallback(() => {
    const density = { kick: 0.28, snare: 0.16, hat: 0.55, synth: 0.14 };
    setPattern(Object.fromEntries(SEQ_TRACKS.map((t) => [t.id, Array.from({ length: STEPS }, (_, i) => {
      if (t.id === 'kick' && i === 0) return 1;
      if (t.id === 'snare' && (i === 4 || i === 12)) return 1;
      return Math.random() < density[t.id] ? 1 : 0;
    })])));
  }, []);

  const changeSequenceLength = useCallback((value) => { stop(); setSequenceLength(value); }, [stop]);

  const newProject = useCallback(() => {
    stop(); setProjectId(null); setProjectName('Unsaved Beat'); setPattern(clonePattern(DEFAULT_PATTERN)); setSequenceLength(16); setSwing(0); setMutes({}); setTrackVolumes(DEFAULT_TRACK_VOLUMES); setBpm(120); setVolume(0.85); setRate(1); setActiveStems({}); setLpf(false); setEcho(false); setHydrated(true);
  }, [stop, setBpm]);

  const buildSnapshot = useCallback((id, name) => ({ id, name, schemaVersion: 3, bpm, pattern: clonePattern(pattern), sequenceLength, swing, mutes: { ...mutes }, trackVolumes: { ...trackVolumes }, volume, rate, activeStems: { ...activeStems }, lpf, echo }), [bpm, pattern, sequenceLength, swing, mutes, trackVolumes, volume, rate, activeStems, lpf, echo]);

  const handleSave = useCallback(async (name) => { const id = projectId || `project-${Date.now()}`; const saved = await saveProject(buildSnapshot(id, name)); setProjectId(saved.id); setProjectName(saved.name); setHydrated(true); }, [projectId, buildSnapshot]);

  const handleLoad = useCallback((project) => {
    stop(); setProjectId(project.id); setProjectName(project.name || 'My Beat');
    const loadedPattern = clonePattern(project.pattern || DEFAULT_PATTERN);
    setPattern(Object.fromEntries(SEQ_TRACKS.map((t) => [t.id, [...(loadedPattern[t.id] || []), ...new Array(STEPS - (loadedPattern[t.id] || []).length).fill(0)].slice(0, STEPS)])));
    setSequenceLength([16, 32, 64].includes(Number(project.sequenceLength)) ? Number(project.sequenceLength) : 16); setSwing(typeof project.swing === 'number' ? Math.max(0, Math.min(0.3, project.swing)) : 0); setMutes(project.mutes || {}); setTrackVolumes({ ...DEFAULT_TRACK_VOLUMES, ...(project.trackVolumes || {}) }); setBpm(Number(project.bpm) || 120); setVolume(typeof project.volume === 'number' ? project.volume : 0.85); setRate(typeof project.rate === 'number' ? project.rate : 1); setActiveStems(project.activeStems || {}); setLpf(!!project.lpf); setEcho(!!project.echo); setHydrated(true);
  }, [stop, setBpm]);

  useEffect(() => { if (!hydrated || !projectId) return undefined; const timer = setTimeout(() => saveProject(buildSnapshot(projectId, projectName)), 900); return () => clearTimeout(timer); }, [hydrated, projectId, projectName, buildSnapshot]);
  useEffect(() => { if (!ready && playing) stop(); }, [ready, playing, stop]);
  const padSize = useMemo(() => (Math.min(width, 520) - SPACE.lg * 2) / 4, [width]);
  if (!ready) return <LoadingScreen progress={progress} error={error} />;
  const stemsOn = Object.values(activeStems).filter(Boolean).length;

  return <View style={[styles.root, { paddingTop: insets.top }]}>
    <StatusBar barStyle="light-content" backgroundColor={C.bg} />
    <View style={styles.header}><View style={styles.brandRow}><View style={styles.brandIcon}><AudioWaveform size={17} color={C.cyan} /></View><View><Text style={styles.brand}>BEATFORGE</Text><Text style={styles.brandSub}>{playing ? '● LIVE' : '○ IDLE'} · {stemsOn} STEM{stemsOn === 1 ? '' : 'S'} · {rate.toFixed(2)}x</Text></View></View><View style={[styles.syncPill, playing && { borderColor: C.lime }]}><Text style={[styles.syncText, playing && { color: C.lime }]}>SYNC {STEM_BPM}</Text></View></View>
    <ScrollView style={styles.scroll} contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACE.xl }]} showsVerticalScrollIndicator={false}>
      <ProjectBar projectName={projectName} onSave={handleSave} onNew={newProject} onLoad={handleLoad} />
      <Transport playing={playing} onToggle={toggle} bpm={bpm} onTapTempo={tapTempo} tapCount={tapCount} onClear={clearPattern} onRandom={randomPattern} />
      <Section icon={<Grid3x3 size={12} color={C.textFaint} />} title="PERFORMANCE PADS"><View style={styles.padGrid}>{PADS.map((pad) => <Pad key={pad.id} pad={pad} size={padSize} onTrigger={triggerPad} />)}</View></Section>
      <Section icon={<Grid3x3 size={12} color={C.textFaint} />} title={`${sequenceLength}-STEP SEQUENCER`}><Sequencer pattern={pattern} onToggleStep={toggleStep} currentStep={playing ? currentStep : -1} mutes={mutes} onToggleMute={toggleMute} steps={sequenceLength} onStepsChange={changeSequenceLength} swing={swing} onSwingChange={setSwing} /></Section>
      <Section icon={<Disc3 size={12} color={C.textFaint} />} title="MIXER"><BpmSlider bpm={bpm} onChange={setBpm} /><VolumeSlider volume={volume} onChange={handleVolume} /><RateSlider rate={rate} onChange={handleRate} /><TrackMixer volumes={trackVolumes} onChange={handleTrackVolume} /></Section>
      <Section icon={<Disc3 size={12} color={C.textFaint} />} title="LOOP STEMS · BEAT-SYNCED"><StemBar activeStems={activeStems} onToggle={toggleStem} /></Section>
      <Section icon={<AudioWaveform size={12} color={C.textFaint} />} title="FILTER FX"><FxBar lpf={lpf} onLpf={toggleLpf} echo={echo} onEcho={() => setEcho((p) => !p)} onRiser={fireRiser} onVinyl={fireVinyl} /></Section>
      <Text style={styles.footer}>Projects auto-save locally · 16 pads · 4 tracks · 4/16-bar patterns · swing · per-track mix</Text>
    </ScrollView>
  </View>;
}

const Section = ({ icon, title, children }) => <View style={styles.section}><View style={styles.sectionHead}>{icon}<Text style={styles.sectionTitle}>{title}</Text><View style={styles.sectionLine} /></View>{children}</View>;
export default function App() { return <SafeAreaProvider><Studio /></SafeAreaProvider>; }

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: C.bg }, header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACE.lg, paddingVertical: SPACE.md, borderBottomWidth: 1, borderBottomColor: C.line }, brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, brandIcon: { width: 34, height: 34, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.cyan, backgroundColor: C.panel, alignItems: 'center', justifyContent: 'center', shadowColor: C.cyan, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 }, brand: { color: C.text, fontSize: 14, fontWeight: '900', letterSpacing: 1.5 }, brandSub: { color: C.textFaint, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 }, syncPill: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel }, syncText: { color: C.textFaint, fontSize: 9, fontWeight: '900', letterSpacing: 1 }, scroll: { flex: 1 }, scrollContent: { paddingHorizontal: SPACE.lg, paddingTop: SPACE.md, gap: SPACE.lg }, section: { gap: SPACE.sm }, sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6 }, sectionTitle: { color: C.textFaint, fontSize: 9, fontWeight: '900', letterSpacing: 1.6 }, sectionLine: { flex: 1, height: 1, backgroundColor: C.line, marginLeft: 4 }, padGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 }, footer: { color: C.textFaint, fontSize: 9, textAlign: 'center', letterSpacing: 0.8, marginTop: SPACE.sm, opacity: 0.7 } });
