const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

async function load(reduced=false){
  let now=1000, seq=0;
  const timers=new Map(), played=[];
  class Clock extends Date {static now(){return now;}}
  class Context {
    state='running'; currentTime=0; destination={};
    createOscillator(){
      const osc={frequency:{setValueAtTime(f){osc.freq=f;}},connect(){},disconnect(){},
        start(){played.push([osc.freq,osc.type]);},stop(){}};
      return osc;
    }
    createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}};}
    suspend(){this.state='suspended';return Promise.resolve();}
    resume(){this.state='running';return Promise.resolve();}
  }
  const context=vm.createContext({Date:Clock,window:{AudioContext:Context},
    matchMedia:()=>({matches:reduced}),setTimeout(fn){timers.set(++seq,fn);return seq;},
    clearTimeout(id){timers.delete(id);}});
  const modules=new Map();
  function get(name){
    if(!modules.has(name)) modules.set(name,new vm.SourceTextModule(
      fs.readFileSync(path.resolve(__dirname,'../src',name),'utf8'),{context,identifier:name}));
    return modules.get(name);
  }
  const audio=get('audio.js'); await audio.link(spec=>get(spec.slice(2))); await audio.evaluate();
  const renderer=get('renderer.js'); await renderer.link(spec=>get(spec.slice(2))); await renderer.evaluate();
  const advance=ms=>{now+=ms;};
  const flush=()=>{const pending=[...timers.values()];timers.clear();pending.forEach(fn=>fn());};
  return {audio:audio.namespace.AudioController,Renderer:renderer.namespace.Renderer,
    skins:get('skins.js').namespace, soundCue:get('skin-sounds.js').namespace.soundCue,
    timers,played,flush,advance};
}
test('every skin has three distinct, short, low-volume synthesized cues',async()=>{
  const h=await load();
  for(const type of ['move','capture','win']){
    const cues=[...h.skins.SKINS,...h.skins.SEASONAL_SKINS].map(s=>h.soundCue(s.id,type));
    assert.equal(new Set(cues.map(JSON.stringify)).size,13);
    assert.ok(cues.every(c=>c.length && c.every(n=>n[3]<=.08 && n[2]<=.3 && n[4]<=300)));
  }
});
test('mute and pause cancel pending sounds and preview does not equip a skin',async()=>{
  const h=await load(), a=new h.audio();
  a.init();a.score('royal');
  assert.equal(h.played[0][0],659);
  assert.equal(h.skins.activeSkin().id,'neon');
  assert.ok(h.timers.size>0);
  a.enabled=false;assert.equal(h.timers.size,0);
  const count=h.played.length; a.score('cyber');h.flush();assert.equal(h.played.length,count);
  a.enabled=true;a.init();a.win('ice');assert.ok(h.timers.size>0);
  a.pause();assert.equal(h.timers.size,0);
});
function canvas(){
  const log=[];
  const ctx=new Proxy({},{get(o,k){if(k in o)return o[k];return (...a)=>log.push([k,...a]);}});
  return {getContext:()=>ctx,log};
}
test('each capture effect expires and is clipped to its own square',async()=>{
  const h=await load();
  for(const skin of [...h.skins.SKINS,...h.skins.SEASONAL_SKINS]){
    const c=canvas(),r=new h.Renderer(c,skin);
    r.CELL=60;r.offX=r.offY=10;
    r.spawnParticles(2,2,1); assert.equal(r.particles.length,1);
    h.advance(100);r.updateParticles();
    assert.ok(c.log.some(x=>x[0]==='clip'),skin.id);
    assert.equal(r.particles[0].effect,skin.finish.effect);
    h.advance(1000);r.updateParticles();assert.equal(r.particles.length,0);
  }
});
test('reduced motion suppresses optional capture animations',async()=>{
  const h=await load(true),r=new h.Renderer(canvas());
  r.spawnParticles(2,2,1);assert.equal(r.particles.length,0);
});


test('P4.3 Core Neon move sweep and capture scale are finite and opt-in',async()=>{
  const h=await load(),r=new h.Renderer(canvas());
  const move={t:'h',r:2,c:1};
  r.animateMove(move,1);assert.equal(r.moveEffect,null);
  r.premiumMatch=true;r.animateMove(move,1);
  assert.equal(r.moveProgress(),0);assert.equal(r.moveEffect.player,1);
  r.spawnParticles(2,1,1);assert.equal(r.particles[0].duration,380);
  assert.equal(r.captureScale(2,1,1000),.72);assert.equal(r.captureScale(1,1,1000),1);
  h.advance(90);assert.equal(r.moveProgress(),.5);
  assert.ok(r.captureScale(2,1,1090)>.72);
  h.advance(140);assert.equal(r.moveProgress(),null);assert.equal(r.captureScale(2,1,1230),1);
  r.CELL=60;r.offX=r.offY=10;h.advance(200);r.updateParticles();assert.equal(r.particles.length,0);
});
test('P4.3 reduced motion and alternate skins do not activate premium effects',async()=>{
  const h=await load(true),r=new h.Renderer(canvas());r.premiumMatch=true;
  r.animateMove({t:'v',r:1,c:1},0);r.spawnParticles(1,1,0);
  assert.equal(r.moveEffect,null);assert.equal(r.particles.length,0);assert.equal(r.captureScale(1,1,1000),1);
  const k=await load(),royal=new k.Renderer(canvas(),k.skins.SKINS.find(s=>s.id==='royal'));
  royal.premiumMatch=true;royal.animateMove({t:'v',r:1,c:1},0);royal.spawnParticles(1,1,0);
  assert.equal(royal.moveEffect,null);assert.equal(royal.particles[0].duration,royal.skin.finish.duration);
});


test('P4.7b cinematic capture stays clipped, finite and uses real gain and bounded chain',async()=>{
  const h=await load(),c=canvas(),r=new h.Renderer(c);r.premiumMatch=true;r.CELL=60;r.offX=r.offY=10;
  r.spawnParticles(1,2,1,{gain:2,chain:9});const p=r.particles[0];
  assert.equal(p.duration,480);assert.equal(p.intensity,4);assert.equal(p.double,true);
  h.advance(100);r.updateParticles();assert.ok(c.log.some(x=>x[0]==='clip'));
  for(const [op,x,y,w,z] of c.log.filter(x=>x[0]==='fillRect')){
    assert.ok(x>=130&&y>=70&&x+w<=190&&y+z<=130);
  }
  h.advance(381);r.updateParticles();assert.equal(r.particles.length,0);
  r.spawnParticles(1,2,1,{gain:1,chain:3});assert.equal(r.particles[0].duration,460);
  r.spawnParticles(1,2,1,{gain:1,chain:1});assert.equal(r.particles[1].duration,420);
});
test('P4.7b distinct capture sound uses cancellable audio cues and keeps mute authoritative',async()=>{
  const h=await load(),a=new h.audio();a.init();a.captureFeedback(2,2);h.flush();
  assert.ok(h.played.some(x=>x[0]===1568));
  a.captureFeedback(1,3);h.flush();assert.ok(h.played.some(x=>x[0]===1319));
  a.captureFeedback(2,2);a.pause();const count=h.played.length;h.flush();assert.equal(h.played.length,count);
  a.resume();a.enabled=false;a.captureFeedback(2,2);assert.equal(h.timers.size,0);assert.equal(h.played.length,count);
});
