const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
async function load(){
 const context=vm.createContext({}),mods=new Map();
 function mod(name){if(!mods.has(name))mods.set(name,new vm.SourceTextModule(fs.readFileSync(path.resolve(__dirname,'../src',name),'utf8'),{context,identifier:name}));return mods.get(name);}
 const mission=mod('career-missions.js');await mission.link(s=>mod(path.basename(s)));await mission.evaluate();
 const profile=mod('profile.js');await profile.link(()=>{throw Error('unexpected import')});await profile.evaluate();
 const ai=mod('ai.js');await ai.link(s=>mod(path.basename(s)));await ai.evaluate();
 return {m:mission.namespace,p:profile.namespace,a:ai.namespace};
}
test('campaign spans 100 stages with compatible old tiers and six bosses',async()=>{
 const {p,a}=await load();assert.equal(p.CAREER_LEVEL_COUNT,100);
 assert.deepEqual(Array.from(p.CAREER_WORLDS,w=>w.end),[10,25,40,60,80,100]);
 for(let i=1;i<=100;i++){const stage=p.careerLevel(i);assert.ok(p.careerWorld(i));assert.doesNotThrow(()=>a.aiStrength(stage.diff,i));}
 assert.equal(p.careerLevel(30).size,8);assert.equal(p.careerLevel(100).size,10);
});
test('new version-one openings are replayable and legal without awarded points',async()=>{
 const {p,m}=await load();const signatures=new Set();
 for(let i=31;i<=100;i++){const stage=p.careerLevel(i),settings={size:stage.size,careerLevel:i,openingVersion:1};
 const board=m.startingBoard(settings);assert.equal(JSON.stringify(board),JSON.stringify(m.startingBoard(settings)));
 assert.equal(board.score[0]+board.score[1],0);assert.ok(board.getFreeMoves().length>0);signatures.add(JSON.stringify(m.missionFor(i).edges));}
 assert.equal(signatures.size,70);assert.equal(m.missionFor(30),undefined);
});
