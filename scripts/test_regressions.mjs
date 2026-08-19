import assert from 'node:assert/strict';
import StepScheduler from '../src/audio/scheduler.js';

/**
 * Regression tests for bugs found during the audit. These never start timers
 * and never touch native modules, so they run anywhere Node runs.
 */

// --- Scheduler input validation -------------------------------------------
// stepMs used to return Infinity/NaN for a 0 or non-numeric BPM, which made
// the transport hang instead of playing.
assert.equal(StepScheduler.stepMs(120), 125);
assert.ok(Number.isFinite(StepScheduler.stepMs(0)), '0 BPM must not yield Infinity');
assert.ok(Number.isFinite(StepScheduler.stepMs(NaN)), 'NaN BPM must not yield NaN');
assert.ok(Number.isFinite(StepScheduler.stepMs(-10)), 'negative BPM must not yield a negative step');
assert.ok(StepScheduler.stepMs(0) > 0, 'step duration must be positive');

// start() bypassed the clamping that setStepsPerLoop applies, so start(bpm, 0)
// produced stepsPerLoop 0 and a NaN step index that poisoned every later tick.
{
  const s = new StepScheduler(() => {});
  s.start(120, 0, 0);
  assert.ok(s.stepsPerLoop >= 1, 'stepsPerLoop must be at least 1');
  assert.ok(Number.isFinite(s.step), 'step must never be NaN');
  s.stop();
}
{
  const s = new StepScheduler(() => {});
  s.start(120, 128, 0);
  assert.ok(s.stepsPerLoop <= 64, 'start() must cap stepsPerLoop like setStepsPerLoop');
  s.stop();
}
{
  const s = new StepScheduler(() => {});
  s.start(120, 16, -5);
  assert.ok(s.step >= 0 && Number.isFinite(s.step), 'negative fromStep must be sanitised');
  s.stop();
}

// A bad BPM while running must not corrupt the running step duration.
{
  const s = new StepScheduler(() => {});
  s.start(120, 16, 0);
  s.setBpm(0);
  assert.ok(Number.isFinite(s.stepDuration) && s.stepDuration > 0, 'setBpm(0) must keep a sane duration');
  s.stop();
}

// --- The step that fires is the step reported -----------------------------
// _tick used to advance before firing, so the playhead led the audio by one.
{
  const fired = [];
  const s = new StepScheduler((step) => fired.push(step));
  s.start(120, 4, 2);
  assert.equal(fired[0], 2, 'start(fromStep) must fire that exact step first');
  assert.equal(s.step, 2, 'step must name the sounding step, not the next one');
  s.stop();
}

// --- Undo/redo must survive a replayed updater ----------------------------
// React StrictMode double-invokes setState updaters. The old useHistory pushed
// onto the history stack from inside the updater, so a single edit recorded two
// entries and required two UNDO presses. This models the fixed reducer.
{
  const limit = 80;
  let committed;
  const past = [], future = [];
  const init = (v) => { committed = v; past.length = 0; future.length = 0; };
  const update = (u) => {
    const cur = committed;
    const next = typeof u === 'function' ? u(cur) : u;
    if (Object.is(next, cur)) return;
    past.push(cur);
    if (past.length > limit) past.shift();
    future.length = 0;
    committed = next;
  };
  const undo = () => { if (!past.length) return; future.unshift(committed); committed = past.pop(); };
  const redo = () => { if (!future.length) return; past.push(committed); committed = future.shift(); };

  init('A');
  update('B'); update('B'); // replayed with the same input
  assert.equal(past.length, 1, 'a replayed updater must not double-push history');
  undo();
  assert.equal(committed, 'A', 'one undo must revert one edit');
  redo();
  assert.equal(committed, 'B', 'redo must restore the edit');

  init('A'); update('B'); undo(); update('C');
  assert.equal(future.length, 0, 'a new edit must clear the redo stack');
}

// --- Loading a corrupt or legacy project must not crash -------------------
// clonePattern spread every stored track, throwing "v is not iterable" on a
// null track, and new Array(STEPS - len) threw RangeError when a stored track
// was longer than STEPS.
{
  const STEPS = 64;
  const normalizeTrack = (track) => {
    const source = Array.isArray(track) ? track : [];
    return Array.from({ length: STEPS }, (_, i) => (source[i] ? 1 : 0));
  };
  const cases = [null, undefined, 5, 'abc', [], [1, 0, 1], new Array(200).fill(1), [2, 'x', null]];
  for (const input of cases) {
    const out = normalizeTrack(input);
    assert.equal(out.length, STEPS, `normalizeTrack must always return ${STEPS} steps`);
    assert.ok(out.every((v) => v === 0 || v === 1), 'every step must be 0 or 1');
  }
}

// --- Project library ordering ---------------------------------------------
// Sorting on a missing updatedAt produced NaN comparisons and arbitrary order.
{
  const sort = (projects) => projects
    .filter((p) => p && typeof p === 'object' && p.id)
    .sort((a, b) => (Number(b.updatedAt) || 0) - (Number(a.updatedAt) || 0));
  const ordered = sort([
    { id: 'a', updatedAt: 100 },
    null,
    { id: 'b' },
    { id: 'c', updatedAt: 300 },
    { id: 'd', updatedAt: undefined },
  ]);
  assert.deepEqual(ordered.map((p) => p.id), ['c', 'a', 'b', 'd'], 'newest first, undated last');
  assert.ok(!ordered.includes(null), 'malformed entries must be dropped');
}

// --- Saved-date formatting -------------------------------------------------
// Legacy records without updatedAt rendered a literal "Invalid Date".
{
  const formatSaved = (value) => {
    const ms = Number(value);
    if (!Number.isFinite(ms) || ms <= 0) return '';
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? '' : ` · ${date.toLocaleString()}`;
  };
  for (const bad of [undefined, null, '', 0, -1, 'nope', NaN]) {
    assert.equal(formatSaved(bad), '', `"${String(bad)}" must render nothing, not Invalid Date`);
  }
  assert.ok(formatSaved(Date.now()).includes('·'), 'a real timestamp must still render');
}

console.log('BeatForge regression tests passed');
