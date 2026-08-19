import assert from 'node:assert/strict';
import StepScheduler from '../src/audio/scheduler.js';

// Deterministic scheduler contract tests. These tests never start timers.
assert.equal(StepScheduler.stepMs(120), 125, '120 BPM should produce a 125 ms step');
assert.equal(StepScheduler.stepMs(60), 250, '60 BPM should produce a 250 ms step');

const fired = [];
const scheduler = new StepScheduler((step) => fired.push(step));

scheduler.setStepsPerLoop(64);
assert.equal(scheduler.stepsPerLoop, 64);
scheduler.step = 63;
scheduler.setStepsPerLoop(32);
assert.equal(scheduler.step, 31, 'changing loop length should wrap the current step');

scheduler.baseStepDuration = 125;
scheduler.step = 0;
scheduler.setSwing(0.2);
assert.equal(scheduler.swing, 0.2);
assert.equal(scheduler.durationForStep(0), 100);
assert.equal(scheduler.durationForStep(1), 150);

scheduler.setSwing(1);
assert.equal(scheduler.swing, 0.5, 'swing must be capped at 50%');
scheduler.setSwing(-1);
assert.equal(scheduler.swing, 0, 'swing must not be negative');

scheduler.start(120, 64, 63);
assert.equal(scheduler.stepsPerLoop, 64);
assert.equal(scheduler.step, 63);
scheduler.stop();
assert.equal(scheduler.running, false);
assert.equal(fired.length, 1, 'start should fire the first step immediately');
assert.equal(fired[0], 63);

console.log('BeatForge scheduler tests passed');
