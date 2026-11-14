const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
async function load(){
  const context=vm.createContext({Date,Intl});
  const mod=name=>new vm.SourceTextModule(fs.readFileSync(path.resolve(__dirname,'../src',name),'utf8'),{context});
  const constants=mod('constants.js'),skins=mod('skins.js');
  await skins.link(()=>constants);await skins.evaluate();return skins.namespace;
}
test('seven unique preview offers preserve six base skins and never grant ownership',async()=>{
  const s=await load();
  assert.equal(s.SKINS.length,6);assert.equal(s.SEASONAL_SKINS.length,7);
  assert.equal(new Set(s.SEASONAL_SKINS.map(k=>k.offer.productId)).size,7);
  for(const k of s.SEASONAL_SKINS){
    assert.equal(s.getSkin(k.id).id,k.id);
    assert.equal(s.unlockedSkin(k.id,{unlockedLevel:100}),false);
    assert.equal(s.saveSkin({setItem(){throw Error('must not write')}},'guest',k.id,{},{}),'locked');
    assert.equal(s.setActiveSkin(k.id).id,'neon');
    assert.ok(fs.existsSync(path.resolve(__dirname,'../src/skin-art',k.id+'.svg')));
  }
  assert.equal(s.skinCatalog(null,null,'neon').length,6);
});
test('inclusive UTC dates, year wrap, overlap, out-of-season, invalid date',async()=>{
  const s=await load(),offer=s.getSeasonalSkin('frozen-christmas').offer;
  const get=d=>s.seasonStatus(offer,new Date(d));
  assert.equal(get('2026-11-30T23:59:59Z').active,false);
  assert.equal(get('2026-12-01T00:00:00Z').daysLeft,41);
  assert.equal(get('2027-01-10T23:59:59Z').daysLeft,1);
  assert.equal(get('2027-01-11T00:00:00Z').active,false);
  assert.equal(get('invalid').active,false);
  assert.equal(s.seasonalCatalog(new Date('2026-10-30')).filter(x=>x.active).length,2);
  assert.ok(s.seasonalCatalog(new Date('2026-12-25')).every(x=>!x.owned));
});
