import { useCallback, useRef, useState } from 'react';

export default function useHistory(initialValue, limit = 80) {
  const [state, setState] = useState(initialValue);
  const past = useRef([]);
  const future = useRef([]);
  const update = useCallback((nextOrUpdater) => setState((current) => {
    const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater;
    if (Object.is(next, current)) return current;
    past.current = [...past.current.slice(-(limit - 1)), current];
    future.current = [];
    return next;
  }), [limit]);
  const undo = useCallback(() => setState((current) => {
    if (!past.current.length) return current;
    const previous = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [current, ...future.current].slice(0, limit);
    return previous;
  }), [limit]);
  const redo = useCallback(() => setState((current) => {
    if (!future.current.length) return current;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current.slice(-(limit - 1)), current];
    return next;
  }), [limit]);
  const reset = useCallback((next) => { past.current = []; future.current = []; setState(next); }, []);
  return { state, setState: update, undo, redo, reset, canUndo: past.current.length > 0, canRedo: future.current.length > 0 };
}
