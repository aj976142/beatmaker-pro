import { useCallback, useEffect, useRef, useState } from 'react';
import StepScheduler from '../audio/scheduler';

export default function useTransport({ onStepFired }) {
  const scheduler = useRef(null);
  const callbackRef = useRef(onStepFired); callbackRef.current = onStepFired;
  const [bpm, setBpm] = useState(120), [playing, setPlaying] = useState(false), [currentStep, setCurrentStep] = useState(0), [tapCount, setTapCount] = useState(0);
  useEffect(() => () => scheduler.current?.stop(), []);
  const start = useCallback(() => { if (!scheduler.current) scheduler.current = new StepScheduler((step) => { setCurrentStep(step); callbackRef.current(step); }); scheduler.current.start(bpm, 16, currentStep); setPlaying(true); }, [bpm, currentStep]);
  const stop = useCallback(() => { scheduler.current?.stop(); setPlaying(false); }, []);
  const toggle = useCallback(() => playing ? stop() : start(), [playing, start, stop]);
  const changeBpm = useCallback((v) => { setBpm(v); scheduler.current?.setBpm(v); }, []);
  const tapTimes = useRef([]);
  const tapTempo = useCallback(() => { const t = Date.now(); tapTimes.current = [...tapTimes.current.filter((x) => t - x < 2000), t].slice(-6); if (tapTimes.current.length >= 2) { const xs = tapTimes.current; const avg = (xs[xs.length - 1] - xs[0]) / (xs.length - 1); changeBpm(Math.max(60, Math.min(180, 60000 / avg))); } setTapCount((x) => x + 1); }, [changeBpm]);
  return { bpm, setBpm: changeBpm, playing, toggle, stop, currentStep, tapTempo, tapCount };
}
