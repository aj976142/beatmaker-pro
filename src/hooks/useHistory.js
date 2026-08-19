import { useCallback, useRef, useState } from 'react';

/**
 * Undo/redo stack.
 *
 * The past/future stacks are kept in refs but are mutated from inside the
 * setState updater, which React may invoke more than once for a single update
 * (StrictMode double-invokes updaters in development, and concurrent rendering
 * may replay them). Pushing history from inside the updater therefore recorded
 * one edit twice and forced the user to press UNDO twice to revert it.
 *
 * Instead the stacks are derived from a single committed value, so replaying
 * the updater is harmless: history is only pushed for a genuinely new state.
 */
export default function useHistory(initialValue, limit = 80) {
  const [state, setState] = useState(initialValue);
  const past = useRef([]);
  const future = useRef([]);
  // The state the history stacks were last reconciled against.
  const committed = useRef(initialValue);
  const [, forceRender] = useState(0);

  const update = useCallback((nextOrUpdater) => {
    const current = committed.current;
    const next = typeof nextOrUpdater === 'function' ? nextOrUpdater(current) : nextOrUpdater;
    if (Object.is(next, current)) return;
    past.current = [...past.current.slice(-(limit - 1)), current];
    future.current = [];
    committed.current = next;
    setState(next);
  }, [limit]);

  const undo = useCallback(() => {
    if (!past.current.length) return;
    const previous = past.current[past.current.length - 1];
    past.current = past.current.slice(0, -1);
    future.current = [committed.current, ...future.current].slice(0, limit);
    committed.current = previous;
    setState(previous);
  }, [limit]);

  const redo = useCallback(() => {
    if (!future.current.length) return;
    const next = future.current[0];
    future.current = future.current.slice(1);
    past.current = [...past.current.slice(-(limit - 1)), committed.current];
    committed.current = next;
    setState(next);
  }, [limit]);

  const reset = useCallback((next) => {
    past.current = [];
    future.current = [];
    committed.current = next;
    setState(next);
    forceRender((n) => n + 1);
  }, []);

  return {
    state,
    setState: update,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
  };
}
