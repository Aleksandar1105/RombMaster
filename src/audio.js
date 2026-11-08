export class AudioController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.paused = false;
    this.timers = new Set();
    this.oscillators = new Set();
    this.generation = 0;
  }
  
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    this.resume();
  }

  resume() {
    this.paused = false;
    if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  pause() {
    this.paused = true;
    this.generation++;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const osc of this.oscillators) {
      try { osc.stop(); } catch {}
    }
    this.oscillators.clear();
    if (this.ctx?.state === 'running') this.ctx.suspend().catch(() => {});
  }

  later(callback, delay) {
    if (this.paused) return;
    const generation = this.generation;
    const timer = setTimeout(() => {
      this.timers.delete(timer);
      if (!this.paused && generation === this.generation) callback();
    }, delay);
    this.timers.add(timer);
  }

  playTone(freq, type, duration, vol = 0.1) {
    if (this.paused || !this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    this.oscillators.add(osc);
    osc.onended = () => { this.oscillators.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  move() { this.playTone(300, 'sine', 0.1, 0.05); }
  score() { this.playTone(600, 'triangle', 0.1, 0.1); this.later(() => this.playTone(800, 'sine', 0.2, 0.1), 100); }
  win() { [400, 500, 600, 800].forEach((f, i) => this.later(() => this.playTone(f, 'square', 0.2, 0.1), i * 150)); }
}
