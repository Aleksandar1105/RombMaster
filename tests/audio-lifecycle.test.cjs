const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

async function setup() {
  const timers = new Map(), oscillators = [];
  let id = 0;
  class AudioContext {
    constructor() { this.state = 'running'; this.currentTime = 0; }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
    createOscillator() {
      const oscillator = { frequency: { setValueAtTime() {} }, connect() {}, disconnect() {}, start() {},
        stop(time) { if (time === undefined) this.stopped = true; } };
      oscillators.push(oscillator);
      return oscillator;
    }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, disconnect() {} }; }
  }
  const context = vm.createContext({ window: { AudioContext },
    setTimeout(callback) { timers.set(++id, callback); return id; }, clearTimeout(id) { timers.delete(id); } });
  const mod = new vm.SourceTextModule(fs.readFileSync(path.join(__dirname, '../src/audio.js'), 'utf8'), { context });
  await mod.link(() => {}); await mod.evaluate();
  const audio = new mod.namespace.AudioController(); audio.init();
  return { audio, timers, oscillators };
}

test('pause cancels pending tones, stops active sound and rejects stale callbacks after resume', async () => {
  const h = await setup();
  h.audio.score();
  const stale = [...h.timers.values()][0];
  assert.equal(h.oscillators.length, 1);
  h.audio.pause();
  assert.equal(h.timers.size, 0);
  assert.equal(h.audio.ctx.state, 'suspended');
  assert.equal(h.oscillators[0].stopped, true);
  h.audio.move();
  assert.equal(h.oscillators.length, 1);
  h.audio.resume();
  stale();
  assert.equal(h.oscillators.length, 1);
  h.audio.move();
  assert.equal(h.oscillators.length, 2);
});

test('pausing before audio initialization is safe', async () => {
  const h = await setup();
  h.audio.ctx = null;
  h.audio.pause();
  h.audio.win();
  assert.equal(h.timers.size, 0);
  h.audio.resume();
});
