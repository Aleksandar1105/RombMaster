const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

async function load(){
 const values=new Map();
 const storage={fail:false,getItem:k=>values.get(k)??null,setItem(k,v){if(this.fail)throw Error('storage failure');values.set(k,v);}};
 const context=vm.createContext({localStorage:storage});
 const mod=name=>new vm.SourceTextModule(fs.readFileSync(path.resolve(__dirname,'../src',name),'utf8'),{context,identifier:name});
 const constants=mod('constants.js'), skins=mod('skins.js'), profile=mod('profile.js');
 await skins.link(()=>constants);await skins.evaluate();
 await profile.link(()=>{throw Error('unexpected dependency')});await profile.evaluate();
 return {s:skins.namespace,p:profile.namespace,storage,values};
}
const empty={stars:{},unlockedLevel:1,stats:{wins:0}};
const daily={completedTotal:0};
function bindEconomy(s,p,storage,d=daily){
 p.configureCharacterEconomy({
  entitlement(id,profile){return s.characterEntitlement(id,profile,s.syncWallet(storage,p.LocalSlots.storageKey(s.WALLET_KEY),profile,d).wallet);},
  preserve(profile){return s.syncWallet(storage,p.LocalSlots.storageKey(s.WALLET_KEY),profile,d).status;}
 });
}
test('25 distinct character IDs, six starters, seven Career, six Elite, six Legendary',async()=>{
 const {s,p}=await load(),cs=s.CHARACTERS;
 assert.equal(cs.length,25);assert.equal(new Set(cs.map(c=>c.id)).size,25);
 for(const [category,count] of [['starter',6],['career',7],['elite',6],['legendary',6]])assert.equal(cs.filter(c=>c.category===category).length,count);
 assert.equal(p.COLLECTIBLE_AVATAR_IDS.length,18);
 assert.equal(new Set([...p.PLAYER_AVATARS.map(c=>c.id),...p.COLLECTIBLE_AVATAR_IDS]).size,25);
 for(const c of cs)assert.ok(fs.existsSync(path.resolve(__dirname,'../src/public',c.art.slice(1))),c.id);
});
test('Career rewards depend on actual boss victory, not merely unlocked level',async()=>{
 const {s}=await load();
 for(const c of s.CHARACTERS.filter(c=>c.category==='career')){
  assert.equal(s.characterEntitlement(c.id,{stars:{},unlockedLevel:100},null),'locked');
  assert.equal(s.characterEntitlement(c.id,{stars:{[c.level]:1}},null),'owned');
  assert.equal(s.characterEntitlement(c.id,empty,{stars:{[c.level]:3}}),'owned');
 }
 assert.equal(s.characterEntitlement('neon-fox',{neonFoxUnlocked:true},null),'owned');
});
test('shared wallet debits skin and character purchases exactly once',async()=>{
 const {s,storage}=await load(),d={completedTotal:0},profile={...empty,stars:{1:3,2:3,3:3,4:3,5:3,6:3,7:3,8:3,9:3,10:3}};
 const w=s.syncWallet(storage,'guest',profile,d).wallet,balance=s.walletBalance(w);
 let b=s.buyWalletCharacter(storage,'guest','circuit-valkyrie',profile,d);
 assert.equal(b.status,'ready');assert.equal(s.walletBalance(b.wallet),balance-400);
 b=s.buyWalletSkin(storage,'guest','cyber',profile,d);
 assert.equal(b.status,'ready');assert.equal(s.walletBalance(b.wallet),balance-1000);
 assert.equal(s.buyWalletCharacter(storage,'guest','circuit-valkyrie',profile,d).status,'owned');
 assert.equal(s.buyWalletSkin(storage,'guest','cyber',profile,d).status,'owned');
 assert.equal(s.walletBalance(s.syncWallet(storage,'guest',profile,d).wallet),balance-1000);
});
test('insufficient funds and preview-only purchases cannot debit wallet',async()=>{
 const {s,storage}=await load();
 s.syncWallet(storage,'guest',empty,daily);const before=storage.getItem('guest');
 assert.equal(s.buyWalletCharacter(storage,'guest','ember-ronin',empty,daily).status,'insufficient');
 for(const id of ['moon-weaver','solar-sovereign','spark','azure-squire','missing']){
  assert.equal(s.buyWalletCharacter(storage,'guest',id,empty,daily).status,'not-for-sale');
 }
 assert.equal(storage.getItem('guest'),before);
});
test('legacy wallet remains readable and purchase migrates optional character list',async()=>{
 const {s,storage}=await load();
 storage.setItem('guest',JSON.stringify({version:1,stars:{},daily:4,spent:0,owned:[]}));
 const b=s.buyWalletCharacter(storage,'guest','circuit-valkyrie',empty,daily);
 assert.equal(b.status,'ready');assert.equal(b.wallet.characters[0],'circuit-valkyrie');assert.equal(s.walletBalance(b.wallet),0);
});
test('corrupt wallet is never replaced; failed debit does not change previous bytes',async()=>{
 const {s,storage}=await load();
 storage.setItem('bad','{broken');
 assert.equal(s.buyWalletCharacter(storage,'bad','circuit-valkyrie',empty,daily).status,'unavailable');
 assert.equal(storage.getItem('bad'),'{broken');
 const d={completedTotal:4};s.syncWallet(storage,'guest',empty,d);
 const before=storage.getItem('guest');storage.fail=true;
 assert.equal(s.buyWalletCharacter(storage,'guest','circuit-valkyrie',empty,d).status,'unavailable');
 assert.equal(storage.getItem('guest'),before);
});
test('only free starters allowed when creating players and unearned equip rejected',async()=>{
 const {s,p,storage}=await load();bindEconomy(s,p,storage);
 assert.equal(p.ProfileStore.createCareerPlayer('Tester','solar-sovereign').status,'bad-avatar');
 assert.equal(p.LocalSlots.createPlayer('Tester','azure-squire').status,'bad-avatar');
 assert.equal(p.ProfileStore.createCareerPlayer('Tester','spark').status,'ready');
 assert.equal(p.ProfileStore.saveAvatar('azure-squire').status,'locked');
 assert.equal(p.ProfileStore.saveAvatar('moon-weaver').status,'locked');
 assert.equal(p.ProfileStore.saveAvatar('solar-sovereign').status,'locked');
 assert.equal(p.ProfileStore.read().profile.avatar,'spark');
});
test('actual profile equip, Career reset and local player isolation preserve ownership',async()=>{
 const {s,p,storage}=await load();const d={completedTotal:4};bindEconomy(s,p,storage,d);
 assert.equal(p.ProfileStore.createCareerPlayer('Tester','spark').status,'ready');
 const profile={...p.ProfileStore.read().profile,stars:{10:3},unlockedLevel:11};
 storage.setItem(p.PROFILE_KEY,JSON.stringify(profile));
 assert.equal(p.ProfileStore.saveAvatar('azure-squire').status,'ready');
 const key=p.LocalSlots.storageKey(s.WALLET_KEY);
 assert.equal(s.buyWalletCharacter(storage,key,'circuit-valkyrie',profile,d).status,'ready');
 assert.equal(p.ProfileStore.saveAvatar('circuit-valkyrie').status,'ready');
 assert.equal(p.ProfileStore.read().profile.avatar,'circuit-valkyrie');
 assert.equal(p.ProfileStore.resetCareer().status,'ready');
 assert.equal(p.ProfileStore.read().profile.unlockedLevel,1);
 assert.equal(p.ProfileStore.read().profile.avatar,'circuit-valkyrie');
 assert.equal(p.ProfileStore.saveAvatar('azure-squire').status,'ready');
 assert.equal(p.LocalSlots.createPlayer('Second','fox').status,'ready');
 assert.equal(p.ProfileStore.saveAvatar('circuit-valkyrie').status,'locked');
 assert.equal(p.LocalSlots.switchTo('guest').status,'ready');
 assert.equal(p.ProfileStore.read().profile.avatar,'azure-squire');
});
test('Career reset refuses when wallet preservation fails',async()=>{
 const {s,p,storage}=await load();
 assert.equal(p.ProfileStore.createCareerPlayer('Tester','fox').status,'ready');
 const before=storage.getItem(p.PROFILE_KEY);
 p.configureCharacterEconomy({entitlement:()=> 'locked',preserve:()=> 'unavailable'});
 assert.equal(p.ProfileStore.resetCareer().status,'unavailable');
 assert.equal(storage.getItem(p.PROFILE_KEY),before);
});
test('six rivals cover 100 levels and match all six collectible milestones',async()=>{
 const {s,p}=await load(),worlds=p.CAREER_WORLDS;
 assert.equal(worlds.length,6);
 assert.equal(worlds[0].start,1);assert.equal(worlds[5].end,100);
 for(const [i,w] of worlds.entries()){
  if(i)assert.equal(w.start,worlds[i-1].end+1);
  assert.equal(p.careerWorld(w.end).rival,w.rival);
  assert.equal(s.CHARACTERS.filter(c=>c.category==='career'&&!c.legacy&&c.level===w.end).length,1);
  assert.ok(fs.existsSync(path.resolve(__dirname,'../src/public/assets/premium/master','rival-'+w.rival.toLowerCase()+'-master.webp')));
 }
});
