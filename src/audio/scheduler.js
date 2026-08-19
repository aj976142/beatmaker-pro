/** Drift-compensated 16th-note scheduler for the mobile sequencer. */
const now = () => typeof global.performance?.now === 'function' ? global.performance.now() : Date.now();

export default class StepScheduler {
  constructor(onStep) {
    this.onStep = onStep;
    this.timer = null;
    this.running = false;
    this.stepDuration = 125;
    this.step = 0;
    this.stepsPerLoop = 16;
    this.nextStepTime = 0;
    this.startTime = 0;
  }

  static stepMs(bpm) { return (60 / bpm / 4) * 1000; }

  start(bpm, stepsPerLoop = 16, fromStep = 0) {
    this.stop();
    this.stepsPerLoop = stepsPerLoop;
    this.stepDuration = StepScheduler.stepMs(bpm);
    this.step = fromStep;
    this.running = true;
    this.startTime = now();
    this.nextStepTime = this.startTime;
    this._tick();
  }

  setBpm(bpm) {
    const next = StepScheduler.stepMs(bpm);
    if (!this.running) { this.stepDuration = next; return; }
    const t = now();
    const elapsed = this.stepDuration - Math.max(0, this.nextStepTime - t);
    const phase = this.stepDuration > 0 ? Math.min(1, Math.max(0, elapsed / this.stepDuration)) : 0;
    this.stepDuration = next;
    this.nextStepTime = t + next * (1 - phase);
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
    let late = t - this.nextStepTime;
    if (late > this.stepDuration * 4) {
      const skip = Math.floor(late / this.stepDuration);
      this.step = (this.step + skip) % this.stepsPerLoop;
      this.nextStepTime += skip * this.stepDuration;
      late = t - this.nextStepTime;
    }
    this.onStep(this.step, this.nextStepTime);
    this.step = (this.step + 1) % this.stepsPerLoop;
    this.nextStepTime += this.stepDuration;
    this._schedule();
  };
}
