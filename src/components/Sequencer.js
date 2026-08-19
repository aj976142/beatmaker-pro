import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { C, GROUP, RADIUS } from '../theme';
import { SEQ_TRACKS } from '../audio/sampleBank';

const Step = memo(({ active, playhead, accent, onPress, downbeat }) => (
  <Pressable onPress={onPress} style={styles.hit} android_disableSound>
    <View style={[styles.step, downbeat && styles.downbeat, active && { backgroundColor: accent, borderColor: accent }, playhead && !active && styles.playhead]} />
  </Pressable>
));

function Sequencer({ pattern, onToggleStep, currentStep, mutes, onToggleMute, steps = 16, onStepsChange, swing = 0, onSwingChange }) {
  return <View>
    <View style={styles.toolbar}>
      <View style={styles.options}>
        {[16, 32, 64].map((value) => <Pressable key={value} onPress={() => onStepsChange?.(value)} style={[styles.option, steps === value && styles.optionActive]}>
          <Text style={[styles.optionText, steps === value && styles.optionTextActive]}>{value}</Text>
        </Pressable>)}
      </View>
      <View style={styles.swingBox}>
        <Text style={styles.swingLabel}>SWING {Math.round(swing * 100)}%</Text>
        <View style={styles.swingButtons}>
          {[0, 0.1, 0.2, 0.3].map((value) => <Pressable key={value} onPress={() => onSwingChange?.(value)} style={[styles.swingButton, swing === value && styles.swingActive]}><Text style={styles.swingText}>{Math.round(value * 100)}</Text></Pressable>)}
        </View>
      </View>
    </View>
    {SEQ_TRACKS.map((track) => {
      const accent = GROUP[track.group] || C.cyan, muted = !!mutes[track.id];
      return <View key={track.id} style={styles.row}>
        <Pressable onPress={() => onToggleMute(track.id)} style={[styles.label, { borderColor: muted ? C.line : accent }]}>
          <Text style={{ color: muted ? C.textFaint : accent, fontSize: 9, fontWeight: '800' }}>{track.label}</Text>
        </Pressable>
        {pattern[track.id].slice(0, steps).map((on, i) => <Step key={i} active={!!on && !muted} playhead={currentStep === i} downbeat={i % 4 === 0} accent={accent} onPress={() => onToggleStep(track.id, i)} />)}
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 },
  options: { flexDirection: 'row', gap: 4 },
  option: { minWidth: 34, paddingVertical: 5, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel, alignItems: 'center' },
  optionActive: { borderColor: C.cyan, backgroundColor: C.panelHi },
  optionText: { color: C.textFaint, fontSize: 9, fontWeight: '900' },
  optionTextActive: { color: C.cyan },
  swingBox: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swingLabel: { color: C.textFaint, fontSize: 8, fontWeight: '800' },
  swingButtons: { flexDirection: 'row', gap: 2 },
  swingButton: { paddingHorizontal: 5, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: C.line },
  swingActive: { borderColor: C.lime },
  swingText: { color: C.textFaint, fontSize: 8, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { width: 54, marginRight: 5, paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1, backgroundColor: C.panel, alignItems: 'center' },
  hit: { flex: 1, paddingHorizontal: 2, paddingVertical: 3 },
  step: { height: 30, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: C.line, backgroundColor: C.bgElev },
  downbeat: { backgroundColor: C.panelHi, borderColor: C.lineHi },
  playhead: { borderColor: C.white, backgroundColor: '#2A2A3E' },
});
export default memo(Sequencer);
