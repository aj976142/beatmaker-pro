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
  }

  static stepMs(bpm) { return (60 / bpm / 4) * 1000; }

  durationForStep(step = this.step) {
    const swing = Math.max(0, Math.min(0.5, this.swing));
    return this.baseStepDuration * (step % 2 ? 1 + swing : 1 - swing);
  }

  start(bpm, stepsPerLoop = 16, fromStep = 0) {
    this.stop();
    this.stepsPerLoop = stepsPerLoop;
    this.baseStepDuration = StepScheduler.stepMs(bpm);
    this.stepDuration = this.durationForStep(fromStep);
    this.step = fromStep % stepsPerLoop;
    this.running = true;
    this.nextStepTime = now();
    this._tick();
  }

  setStepsPerLoop(stepsPerLoop) {
    this.stepsPerLoop = Math.max(1, Math.min(64, Math.round(stepsPerLoop)));
    this.step %= this.stepsPerLoop;
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
    if (late > this.stepDuration * 4) {
      const skip = Math.floor(late / this.stepDuration);
      this.step = (this.step + skip) % this.stepsPerLoop;
      this.nextStepTime += skip * this.stepDuration;
    }
    this.onStep(this.step, this.nextStepTime);
    this.step = (this.step + 1) % this.stepsPerLoop;
    this.stepDuration = this.durationForStep(this.step);
    this.nextStepTime += this.stepDuration;
    this._schedule();
  };
}
