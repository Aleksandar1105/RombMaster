import { activeSkin } from './skins.js';
import { soundCue } from './skin-sounds.js';

export class AudioController {
  constructor() {
    this.ctx = null;
    this._enabled = true;
    this.paused = false;
    this.timers = new Set();
    this.oscillators = new Set();
    this.generation = 0;
  }
  
  get enabled() { return this._enabled; }
  set enabled(value) {
    this._enabled = Boolean(value);
    if (!this._enabled) this.cancelCue();
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
    this.cancelCue();
    if (this.ctx?.state === 'running') this.ctx.suspend().catch(() => {});
  }

  cancelCue() {
    this.generation++;
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    for (const osc of this.oscillators) {
      try { osc.stop(); } catch {}
    }
    this.oscillators.clear();
  }

  later(callback, delay) {
    if (this.paused || !this.enabled) return;
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
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    this.oscillators.add(osc);
    osc.onended = () => { this.oscillators.delete(osc); osc.disconnect(); gain.disconnect(); };
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  cue(event, id = activeSkin().id) {
    if (this.paused || !this.enabled || !this.ctx) return;
    this.cancelCue();
    for (const [freq, type, duration, gain, delay] of soundCue(id,event)) {
      if (delay === 0) this.playTone(freq,type,duration,gain);
      else this.later(() => this.playTone(freq,type,duration,gain),delay);
    }
  }
  move(id) { this.cue('move',id); }
  score(id) { this.cue('capture',id); }
  win(id) { this.cue('win',id); }
}
