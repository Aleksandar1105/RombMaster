const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function modules(globals = {}) {
  const context = vm.createContext({ ...globals });
  const cache = new Map();
  const stubs = {
    'native.js': { Native: {} },
    'career-missions.js': { missionFor:()=>null, startingBoard:()=>null, drawOpening:()=>{} },
    'ai.js': { AI:{} }, 'save.js': { SaveStore:{} },
    'profile.js': { ProfileStore:{}, careerLevel:()=>null, threeStarTarget:()=>0, careerWorld:()=>null }
  };
  function load(name) {
    if (cache.has(name)) return cache.get(name);
    const stub = stubs[name];
    const mod = stub
      ? new vm.SyntheticModule(Object.keys(stub), function(){for(const [k,v] of Object.entries(stub))this.setExport(k,v);},{context,identifier:name})
      : new vm.SourceTextModule(fs.readFileSync(path.join(__dirname,'../src',name),'utf8'),{context,identifier:name});
    cache.set(name,mod);
    return mod;
  }
  return async name => {
    const m=load(name);
    if(m.status==='unlinked')await m.link(spec=>load(path.basename(spec)));
    if(m.status==='linked')await m.evaluate();
    return m.namespace;
  };
}

test('13 skin identifiers are unique and rarity distribution is exact', async()=>{
  const get=await modules();
  const {SKINS,SEASONAL_SKINS}=await get('skins.js');
  const all=[...SKINS,...SEASONAL_SKINS];
  const expected={neon:'Default',royal:'Epic',cyber:'Epic',ice:'Rare',wood:'Rare',white:'Rare',
    'frozen-christmas':'Legendary','golden-dragon':'Legendary','spring-blossom':'Epic',
    'summer-paradise':'Epic','autumn-kingdom':'Epic','halloween-curse':'Legendary','midnight-gold':'Legendary'};
  assert.equal(all.length,13);
  assert.equal(new Set(all.map(s=>s.id)).size,13);
  for(const s of all)assert.equal(s.catalog.rarity,expected[s.id],s.id);
});

test('seasonal cosmetics and Royal Gold remain locked even with max progress', async()=>{
  const get=await modules();
  const {SKINS,SEASONAL_SKINS,unlockedSkin,saveSkin,seasonalCatalog}=await get('skins.js');
  const profile={unlockedLevel:100,stats:{wins:1000}},daily={completedTotal:100};
  const storage={setItem(){assert.fail('locked purchase must never be saved')}};
  for(const skin of [...SEASONAL_SKINS,SKINS.find(s=>s.id==='royal')]){
    assert.equal(unlockedSkin(skin.id,profile,daily),false);
    assert.equal(saveSkin(storage,'key',skin.id,profile,daily),'locked');
  }
  assert.equal(seasonalCatalog(new Date('2026-12-25T12:00:00Z')).length,7);
  assert.ok(seasonalCatalog().every(e=>!e.owned));
});

test('all theme outcome cues are finite and bounded; unknown event stays silent', async()=>{
  const get=await modules();
  const {SKINS,SEASONAL_SKINS}=await get('skins.js');
  const {soundCue}=await get('skin-sounds.js');
  for(const {id} of [...SKINS,...SEASONAL_SKINS]){
    for(const event of ['move','capture','win','defeat','draw']){
      const cue=soundCue(id,event);
      assert.ok(cue.length>0,id+' '+event);
      for(const [freq,wave,duration,gain,delay] of cue){
        assert.ok(Number.isFinite(freq)&&freq>0&&freq<=20000);
        assert.ok(['sine','triangle','square','sawtooth'].includes(wave));
        assert.ok(duration>0&&duration<=1&&gain>0&&gain<=.1&&delay>=0&&delay+duration*1000<=1000);
      }
    }
    assert.equal(soundCue(id,'unknown').length,0);
  }
});

test('AI victory, defeat and draw plus both local winners keep real outcomes',async()=>{
  const get=await modules();
  const {resultPresentation}=await get('skins.js');
  // scores indexed O=0, X=1
  for(const [score,mode,outcome,title] of [
    [[3,5],'ai','victory','Victory'],[[5,3],'ai','defeat','Game Over'],
    [[4,4],'ai','draw','Draw'],[[3,5],'pvp','victory','Player 1 wins'],
    [[5,3],'pvp','victory','Player 2 wins'],[[4,4],'pvp','draw','Draw']
  ]){
    const result=resultPresentation(score,mode);
    assert.equal(result.outcome,outcome);
    assert.equal(result.title,title);
  }
});

test('idle canvas renders once; animation continues only until particles expire',async()=>{
  let id=0, frames=new Map(),draws=0;
  const get=await modules({
    requestAnimationFrame:fn=>{frames.set(++id,fn);return id},
    cancelAnimationFrame:key=>frames.delete(key)
  });
  const {Game}=await get('game.js');
  Game.board={S:4};
  Game.ui={viewGame:{classList:{contains:()=>false}}};
  Game.renderer={CELL:30,particles:[],draw(){draws++}};
  Game.canHumanMove=()=>true;
  const tick=()=>{assert.equal(frames.size,1);const [key,fn]=frames.entries().next().value;frames.delete(key);fn();};
  Game.requestRender();
  Game.requestRender();
  tick();
  assert.equal(draws,1);
  assert.equal(frames.size,0);
  Game.renderer.particles=[1];
  Game.requestRender();
  tick();
  Game.renderer.particles=[];
  tick();
  assert.equal(draws,3);
  assert.equal(frames.size,0);
  Game.requestRender();
  Game.cancelAnimation();
  assert.equal(frames.size,0);
  Game.paused=true;
  Game.requestRender();
  assert.equal(frames.size,0);
});

test('opposing captured cells share a single one-logical-pixel gradient stroke',async()=>{
  const get=await modules();
  const {Renderer}=await get('renderer.js');
  const {getSkin}=await get('skins.js');
  for(const orientation of ['h','v']){
    const strokes=[],target=orientation==='v'?[[50,10],[50,50]]:[[10,50],[50,50]];
    let current=[];
    const ctx=new Proxy({
      beginPath(){current=[]},
      moveTo(x,y){current.push([x,y])},
      lineTo(x,y){current.push([x,y])},
      createLinearGradient(...coords){return {coords,stops:[],addColorStop(t,c){this.stops.push([t,c])}}},
      stroke(){strokes.push({points:current.slice(),width:this.lineWidth,style:this.strokeStyle})}
    },{get(obj,key){return key in obj?obj[key]:(()=>{})}});
    const skin=getSkin('neon');
    const renderer=new Renderer({width:100,height:100,getContext:()=>ctx},skin);
    renderer.CELL=40;renderer.offX=10;renderer.offY=10;
    renderer.paintCapture=()=>{};renderer.drawSymbol=()=>{};
    const h=[[false,false],[false,false],[false,false]],v=[[false,false,false],[false,false,false]];
    if(orientation==='v') v[0][1]=true;else h[1][0]=true;
    const owner=orientation==='v'?[[1,0],[null,null]]:[[1,null],[0,null]];
    renderer.draw({S:2,D:3,h,v,owner,active:(r,c)=>r>=0&&r<2&&c>=0&&c<2},null);
    const shared=strokes.filter(s=>JSON.stringify(s.points)===JSON.stringify(target));
    assert.equal(shared.length,1,orientation);
    assert.equal(shared[0].width,1);
    assert.equal(shared[0].style.stops[0][1],skin.colors.x);
    assert.equal(shared[0].style.stops.at(-1)[1],skin.colors.o);
    assert.deepEqual(shared[0].style.coords,orientation==='v'?[49.5,10,50.5,10]:[10,49.5,10,50.5]);
  }
});
