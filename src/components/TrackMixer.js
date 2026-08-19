import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Volume2 } from 'lucide-react-native';
import { C, GROUP } from '../theme';
import { SEQ_TRACKS } from '../audio/sampleBank';

const clamp = (v) => Math.max(0, Math.min(1, Number(v) || 0));

const Track = memo(({ track, value, onChange }) => {
  const accent = GROUP[track.group] || C.cyan;
  return <View style={styles.track}>
    <View style={styles.head}>
      <View style={styles.name}><Volume2 size={12} color={accent} /><Text style={styles.label}>{track.label}</Text></View>
      <Text style={[styles.value, { color: accent }]}>{Math.round(value * 100)}%</Text>
    </View>
    <Slider style={styles.slider} minimumValue={0} maximumValue={1} step={0.01} value={value} onValueChange={(v) => onChange(track.id, clamp(v))} minimumTrackTintColor={accent} maximumTrackTintColor={C.line} thumbTintColor={accent} />
  </View>;
});

export default memo(function TrackMixer({ volumes, onChange }) {
  return <View style={styles.wrap}>{SEQ_TRACKS.map((track) => <Track key={track.id} track={track} value={typeof volumes[track.id] === 'number' ? volumes[track.id] : 1} onChange={onChange} />)}</View>;
});

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  track: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  name: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: C.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  value: { fontSize: 10, fontWeight: '900' },
  slider: { width: '100%', height: 30 },
});
