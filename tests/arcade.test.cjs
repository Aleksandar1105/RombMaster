const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
async function load(){const context=vm.createContext({Date}),mods=new Map();
 const get=name=>{if(!mods.has(name))mods.set(name,new vm.SourceTextModule(fs.readFileSync(path.resolve(__dirname,'../src',name),'utf8'),{context,identifier:name}));return mods.get(name);};
 const m=get('arcade.js');await m.link(s=>get(path.basename(s)));await m.evaluate();return m.namespace;}
test('perfect move is achievable and rejects inferior moves without mutating board',async()=>{const a=await load();for(let seed=1;seed<=20;seed++){
 const s=a.createArcade('perfect',seed,1,'2026-11-15'),moves=s.board.getFreeMoves();
 assert.equal(s.maxCapture,2);const best=moves.find(m=>a.captureValue(s.board,m)===2),bad=moves.find(m=>a.captureValue(s.board,m)<2);
 const snapshot=JSON.stringify(s.board);assert.equal(a.arcadeMove(s,bad).status,'retry');assert.equal(JSON.stringify(s.board),snapshot);
 assert.equal(a.arcadeMove(s,best).status,'complete');assert.equal(s.outcome,'win');assert.equal(s.attempts,2);
}});
test('Blitz expires without creating a move, Survival stages increase size',async()=>{const a=await load(),s=a.createArcade('blitz');const before=JSON.stringify(s.board);assert.equal(a.arcadeMove(s,s.board.getFreeMoves()[0],10000).status,'timeout');assert.equal(JSON.stringify(s.board),before);assert.equal(s.outcome,'loss');
 assert.ok(a.createArcade('survival',1,5).board.S>a.createArcade('survival',1,1).board.S);
});
test('isolated history, duplicate prevention and invalid records preserved',async()=>{const a=await load(),map=new Map(),storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 const s=a.createArcade('perfect',1,1,'2026-11-15');a.arcadeMove(s,s.board.getFreeMoves().find(m=>a.captureValue(s.board,m)===2));
 assert.equal(a.recordArcade(storage,'guest',s,'2026-11-15').status,'ready');assert.equal(a.recordArcade(storage,'guest',s).status,'ignored');
 assert.equal(a.readArcade(storage,'other').data.history.length,0);
 assert.equal(a.arcadeSummary(a.readArcade(storage,'guest').data,7,'2026-11-15').accuracy,100);
 assert.equal(a.arcadeSummary(a.readArcade(storage,'guest').data,7,'2026-12-15').sessions,0);
 map.set('bad','{"version":1,"history":[{}]}');assert.equal(a.readArcade(storage,'bad').status,'invalid');
});

test('paced AI matches synchronous rules and applies exactly one edge per reply',async()=>{
 const a=await load();
 for(const mode of ['blitz','survival']){
  const fast=a.createArcade(mode),paced=a.createArcade(mode);
  let rounds=0;
  while(!fast.finished){
   assert.ok(++rounds<200);
   const move=fast.board.getFreeMoves()[0],random=()=>0.42;
   a.arcadeMove(fast,move,250,random);
   const before=paced.board.getFreeMoves().length;
   a.arcadeMove(paced,move,250,random,{deferAI:true});
   assert.equal(paced.board.getFreeMoves().length,before-1);
   if(paced.aiPending){
    assert.equal(a.arcadeMove(paced,paced.board.getFreeMoves()[0]).status,'invalid');
    while(paced.aiPending){
     const free=paced.board.getFreeMoves().length;
     a.arcadeReply(paced,random);
     assert.equal(paced.board.getFreeMoves().length,free-1);
    }
   }
   assert.equal(JSON.stringify(paced.board),JSON.stringify(fast.board));
   for(const k of ['finished','outcome','attempts','cells','doubles','bestChain','concessions','decisionMs'])assert.equal(paced[k],fast[k],k);
  }
 }
});
