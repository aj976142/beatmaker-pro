import React, { memo, useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming, interpolateColor, Easing } from 'react-native-reanimated';
import { C, GROUP, RADIUS } from '../theme';
const AnimatedView = Animated.createAnimatedComponent(View);
function Pad({ pad, onTrigger, size, disabled }) {
  const accent = GROUP[pad.group] || C.cyan, hit = useSharedValue(0), press = useSharedValue(0);
  const flash = useCallback(() => { hit.value = withSequence(withTiming(1, { duration: 20, easing: Easing.out(Easing.quad) }), withTiming(0, { duration: 260, easing: Easing.out(Easing.cubic) })); }, [hit]);
  const onIn = useCallback(() => { if (disabled) return; press.value = withTiming(1, { duration: 30 }); flash(); onTrigger(pad.id); }, [disabled, flash, onTrigger, pad.id, press]);
  const onOut = useCallback(() => { press.value = withTiming(0, { duration: 120 }); }, [press]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 - press.value * 0.04 + hit.value * 0.02 }], backgroundColor: interpolateColor(hit.value, [0,1], [C.panel, accent]), borderColor: interpolateColor(hit.value, [0,1], [C.line, accent]), shadowColor: accent, shadowOpacity: 0.15 + hit.value * 0.8, shadowRadius: 4 + hit.value * 18, elevation: hit.value * 12 }));
  return <Pressable onPressIn={onIn} onPressOut={onOut} android_disableSound style={{ width: size, height: size, padding: 4 }} accessibilityRole="button"><AnimatedView style={[styles.pad, style]}><Text style={styles.key}>{pad.key}</Text><Text style={styles.label} adjustsFontSizeToFit>{pad.label}</Text></AnimatedView></Pressable>;
}
const styles = StyleSheet.create({ pad: { flex: 1, borderRadius: RADIUS.lg, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, key: { color: C.textFaint, fontSize: 9, fontWeight: '700', marginBottom: 3 }, label: { color: C.text, fontSize: 11, fontWeight: '800', textAlign: 'center' } });
export default memo(Pad, (a,b) => a.pad.id === b.pad.id && a.size === b.size && a.disabled === b.disabled);
