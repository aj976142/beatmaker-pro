import { useCallback, useEffect, useRef, useState } from 'react';
import SoundEngine from '../audio/SoundEngine';
import { TOTAL_ASSETS } from '../audio/sampleBank';

export default function useSoundEngine() {
  const engine = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ loaded: 0, total: TOTAL_ASSETS, label: '' });
  useEffect(() => {
    let alive = true;
    const e = new SoundEngine(); engine.current = e;
    e.loadAll((loaded, total, label) => alive && setProgress({ loaded, total, label }))
      .then(() => alive && setReady(true))
      .catch((err) => alive && setError(err?.message || String(err)));
    return () => { alive = false; e.dispose(); engine.current = null; };
  }, []);
  const trigger = useCallback((id, velocity = 1) => engine.current?.trigger(id, velocity), []);
  return { engine, ready, progress, error, trigger };
}
