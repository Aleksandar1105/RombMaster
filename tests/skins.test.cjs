const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
async function load() {
  const context = vm.createContext({});
  const mod = name => new vm.SourceTextModule(fs.readFileSync(path.resolve(__dirname,'../src',name),'utf8'),{context});
  const constants = mod('constants.js'), skins=mod('skins.js');
  await skins.link(()=>constants); await skins.evaluate();
  return skins.namespace;
}
test('six skins, default inset, invalid IDs fall back', async()=>{
  const s=await load();
  assert.equal(s.SKINS.length,6); assert.equal(s.getSkin('invalid').id,'neon');
  assert.equal(s.getSkin('neon').fill,'inset');
  assert.equal(new Set(s.SKINS.map(x=>x.id)).size,6);
});
test('unlock thresholds and premium stays locked',async()=>{
  const s=await load();
  assert.equal(s.unlockedSkin('white',{unlockedLevel:4}),false);
  assert.equal(s.unlockedSkin('white',{unlockedLevel:5}),true);
  assert.equal(s.unlockedSkin('ice',{unlockedLevel:15}),true);
  assert.equal(s.unlockedSkin('wood',{stats:{wins:25}}),true);
  assert.equal(s.unlockedSkin('cyber',null,{completedTotal:7}),true);
  assert.equal(s.unlockedSkin('royal',{unlockedLevel:30,stats:{wins:100}},{completedTotal:99}),false);
});
test('per-slot preference, lock guard and storage failure',async()=>{
  const s=await load(), values=new Map(), storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
  const profile={unlockedLevel:15};
  assert.equal(s.saveSkin(storage,'guest','ice',profile),'ready');
  assert.equal(s.readSkin(storage,'guest',profile),'ice');
  assert.equal(s.readSkin(storage,'slot-1',profile),'neon');
  assert.equal(s.saveSkin(storage,'guest','royal',profile),'locked');
  assert.equal(s.readSkin(storage,'guest',profile),'ice');
  assert.equal(s.saveSkin({setItem(){throw Error()}},'guest','white',profile),'unavailable');
});

test('store lists all skins but collection lists only unlocked cosmetics',async()=>{
  const s=await load();
  const initial=s.skinCatalog(null,null,'neon');
  assert.equal(initial.length,6);
  assert.equal(initial.find(x=>x.skin.id==='neon').status,'Equipped');
  assert.equal(initial.find(x=>x.skin.id==='royal').status,'Coming soon');
  assert.equal(initial.find(x=>x.skin.id==='white').status,'Locked');
  assert.deepEqual(Array.from(s.skinCatalog(null,null,'neon',true),x=>x.skin.id),['neon']);
  const profile={unlockedLevel:15,stats:{wins:25}},daily={completedTotal:7};
  const owned=s.skinCatalog(profile,daily,'ice',true);
  assert.equal(owned.length,5);
  assert.equal(owned.filter(x=>x.status==='Equipped').length,1);
  assert.equal(owned.find(x=>x.skin.id==='ice').status,'Equipped');
  assert.equal(owned.find(x=>x.skin.id==='white').status,'Owned');
  assert.ok(owned.every(x=>x.skin.id!=='royal'));
  assert.ok(initial.every(x=>x.skin.catalog.rarity&&x.skin.catalog.effect));
});

test('victory presentation respects AI and local PvP outcomes',async()=>{
  const s=await load();
  for(const [score,mode,outcome,title] of [
    [[2,5],'ai','victory','Victory'],[[5,2],'ai','defeat','Game Over'],
    [[3,3],'ai','draw','Draw'],[[2,5],'pvp','victory','Player 1 wins'],
    [[5,2],'pvp','victory','Player 2 wins'],[[3,3],'pvp','draw','Draw']
  ]){
    const result=s.resultPresentation(score,mode);
    assert.equal(result.outcome,outcome);assert.equal(result.title,title);
  }
});
test('all six skins have bundled art and victory animation definitions',async()=>{
  const s=await load();
  const css=fs.readFileSync(path.resolve(__dirname,'../src/style.css'),'utf8');
  for(const skin of s.SKINS){
    const art=fs.readFileSync(path.resolve(__dirname,'../src/skin-art',skin.id+'.svg'),'utf8');
    assert.ok(art.startsWith('<svg '),skin.id);
    assert.ok(css.includes('@keyframes skin-victory-'+skin.id+' '),skin.id);
    assert.ok(css.includes('@keyframes skin-halo-'+skin.id+' '),skin.id);
  }
  assert.ok(css.includes('prefers-reduced-motion:no-preference'));
});
