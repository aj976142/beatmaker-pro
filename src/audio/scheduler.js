/** Drift-compensated step scheduler with 16/32/64-step loops and swing. */
const now = () => typeof global.performance?.now === 'function' ? global.performance.now() : Date.now();

export default class StepScheduler {
  constructor(onStep) {
    this.onStep = onStep;
    this.timer = null;
    this.running = false;
    this.stepDuration = 125;
    this.baseStepDuration = 125;
    this.step = 0;
    this.stepsPerLoop = 16;
    this.swing = 0;
    this.nextStepTime = 0;
    // Index of the step that will fire next. `step` always holds the step
    // currently sounding, so UI playheads and pattern lookups stay in sync.
    this._pendingStep = 0;
  }

  static stepMs(bpm) {
    const safe = Math.max(20, Math.min(400, Number(bpm) || 120));
    return (60 / safe / 4) * 1000;
  }

  durationForStep(step = this.step) {
    const swing = Math.max(0, Math.min(0.5, this.swing));
    return this.baseStepDuration * (step % 2 ? 1 + swing : 1 - swing);
  }

  start(bpm, stepsPerLoop = 16, fromStep = 0) {
    this.stop();
    this.setStepsPerLoop(stepsPerLoop);
    this.baseStepDuration = StepScheduler.stepMs(bpm);
    const from = Number.isFinite(fromStep) ? Math.max(0, Math.floor(fromStep)) % this.stepsPerLoop : 0;
    this.stepDuration = this.durationForStep(from);
    this.step = from;
    this._pendingStep = this.step;
    this.running = true;
    this.nextStepTime = now();
    this._tick();
  }

  setStepsPerLoop(stepsPerLoop) {
    this.stepsPerLoop = Math.max(1, Math.min(64, Math.round(stepsPerLoop)));
    this.step %= this.stepsPerLoop;
    this._pendingStep %= this.stepsPerLoop;
  }

  setSwing(value) {
    this.swing = Math.max(0, Math.min(0.5, Number(value) || 0));
    this.stepDuration = this.durationForStep();
  }

  setBpm(bpm) {
    const nextBase = StepScheduler.stepMs(bpm);
    if (!this.running) { this.baseStepDuration = nextBase; this.stepDuration = this.durationForStep(); return; }
    const t = now();
    const elapsed = this.stepDuration - Math.max(0, this.nextStepTime - t);
    const phase = this.stepDuration > 0 ? Math.min(1, Math.max(0, elapsed / this.stepDuration)) : 0;
    this.baseStepDuration = nextBase;
    this.stepDuration = this.durationForStep();
    this.nextStepTime = t + this.stepDuration * (1 - phase);
    if (this.timer) clearTimeout(this.timer);
    this._schedule();
  }

  stop() {
    this.running = false;
    if (this.timer) { clearTimeout(this.timer); this.timer = null; }
  }

  phase() {
    if (!this.running || this.stepDuration <= 0) return 0;
    const remain = this.nextStepTime - now();
    return Math.min(1, Math.max(0, 1 - remain / this.stepDuration));
  }

  _schedule() {
    const delay = Math.max(0, this.nextStepTime - now());
    this.timer = setTimeout(this._tick, delay);
  }

  _tick = () => {
    if (!this.running) return;
    const t = now();
    const late = t - this.nextStepTime;
    if (this.stepDuration > 0 && late > this.stepDuration * 4) {
      const skip = Math.floor(late / this.stepDuration);
      this._pendingStep = (this._pendingStep + skip) % this.stepsPerLoop;
      this.nextStepTime += skip * this.stepDuration;
    }
    this.step = this._pendingStep;
    this.onStep(this.step, this.nextStepTime);
    this._pendingStep = (this.step + 1) % this.stepsPerLoop;
    this.stepDuration = this.durationForStep(this._pendingStep);
    this.nextStepTime += this.stepDuration;
    this._schedule();
  };
}
