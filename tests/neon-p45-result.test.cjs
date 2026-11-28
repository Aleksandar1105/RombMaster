const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
async function fixture({outcome='victory',level=7,ready=true,earned=2,next=true,mode='ai'}={}) {
 const elements=new Map();
 const node=()=>({children:[],dataset:{},style:{setProperty(){}},attrs:{},isConnected:true,textContent:'',hidden:false,
   append(...nodes){for(const n of nodes){if(n.id)elements.set(n.id,n);this.children=this.children.filter(x=>x!==n);this.children.push(n);}},
   before(n){elements.set(n.id,n);},replaceChildren(...nodes){this.children=nodes;},contains(n){return this.children.includes(n);},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];},addEventListener(k,fn){this[k]=fn;}});
 const doc={createElement:node,getElementById:id=>elements.get(id)||null};
 for(const id of ['result-title','result-score','result-stars','p1-name','p2-name','nextCareerBtn','match-analysis','againBtn'])elements.set(id,node());
 const overlay=node(),overview=node();overlay.dataset.outcome=outcome;overlay.classList={contains:()=>true};overlay.querySelector=()=>overview;
 const el=doc.getElementById;el('result-score').textContent='7 - 2';el('p1-name').textContent='Player · X';el('p2-name').textContent='Trickster · O';el('nextCareerBtn').hidden=!next;el('nextCareerBtn').textContent='Play level 8';
 const cues=[];const game={settings:{careerLevel:level,mode},careerOutcome:ready?{status:'ready',awardedStars:earned,earnedXP:125,walletReward:{coins:20}}:{status:'unavailable'},resultStarCue:i=>cues.push(i)};
 const mod=new vm.SourceTextModule(read('src/neon-result.js'));await mod.link(()=>{});await mod.evaluate();
 return {render:()=>mod.namespace.renderCoreResult(overlay,game,doc),el,overlay,overview,game,cues};
}
test('P4.5 actual earned stars, score and next level are displayed without writing rewards',async()=>{
 const h=await fixture();const original=JSON.stringify(h.game.careerOutcome);h.render();
 assert.equal(h.el('result-stars').attrs['aria-label'],'2 of 3 stars earned');assert.deepEqual(h.el('result-stars').children.map(s=>s.dataset.earned),['true','true','false']);
 assert.equal(h.el('result-score').children[0].children[1].textContent,'7');assert.equal(h.el('result-score').children[2].children[0].textContent,'Trickster · O');
 assert.equal(h.el('rm-result-note').textContent,'Next challenge · Play level 8');const star=h.el('result-stars').children[0];star.animationend({target:star,animationName:'rm-p47c-star'});assert.deepEqual(h.cues,[0]);
 assert.equal(JSON.stringify(h.game.careerOutcome),original);
});
test('P4.5 defeat, draw, unavailable reward and local matches never display unearned stars',async()=>{
 for(const options of [{outcome:'defeat',next:false},{outcome:'draw',next:false},{ready:false,next:false},{level:null,mode:'pvp',next:false}]){
  const h=await fixture(options);h.render();assert.equal(h.el('result-stars').hidden,true);assert.equal(h.el('result-stars').children.length,0);assert.equal(h.el('match-analysis').hidden,true);
 }
});
test('P4.5 overlay styles isolated, finite motion and focus feedback; main uses existing award flow',()=>{
 const css=read('src/neon-p45-results.css'),main=read('src/main.js');
 assert.ok(css.split('\n').filter(l=>l.trim().startsWith(':root')).every(l=>l.includes('[data-skin="neon"][data-edition="core"] #overlay.flex')));
 assert.ok(css.includes('prefers-reduced-motion:reduce'));assert.ok(css.includes(':focus-visible'));assert.ok(!css.includes('infinite'));
 assert.ok(main.includes("import './neon-p45-results.css';"));assert.ok(main.includes('renderCoreResult(overlay,Game,document)'));
 assert.ok(!/localStorage|ProfileStore|SaveStore|setTimeout/.test(read('src/neon-result.js')));
});


test('P4.7c star arrival sounds once; particle events and stale results are ignored',async()=>{
 const h=await fixture();h.el('result-title').textContent='Victory';h.render();
 assert.equal(h.el('result-title').children[0].textContent,'Victory');
 const [a,b]=h.el('result-stars').children;
 a.animationend({target:a,animationName:'rm-p47c-sparks',pseudoElement:'::after'});assert.deepEqual(h.cues,[]);
 a.animationend({target:a,animationName:'rm-p47c-star'});a.animationend({target:a,animationName:'rm-p47c-star'});assert.deepEqual(h.cues,[0]);
 h.render();b.animationend({target:b,animationName:'rm-p47c-star'});assert.deepEqual(h.cues,[0]);
 const current=h.el('result-stars').children[1];h.overlay.classList.contains=()=>false;
 current.animationend({target:current,animationName:'rm-p47c-star'});assert.deepEqual(h.cues,[0]);
});
test('P4.7c cinematic effects are victory-only, nonblocking and reduced-motion safe',()=>{
 const css=read('src/neon-p47c-victory.css');
 assert.ok(css.split('\n').filter(l=>l.trim().startsWith(':root')).every(l=>l.includes('[data-edition="core"] #overlay.flex[data-outcome="victory"]')));
 assert.ok(css.includes('prefers-reduced-motion:no-preference'));assert.ok(css.includes('pointer-events:none'));assert.ok(!css.includes('infinite'));
 assert.ok(css.includes('rm-p47c-star')&&css.includes('rm-p47c-sparks')&&css.includes('rm-p47c-wave')&&css.includes('rm-p47c-sheen'));
});


test('P4.14a actual match metrics remain hidden and data stays intact',async()=>{
 const h=await fixture({outcome:'defeat',next:false});const a=h.el('match-analysis');
 Object.assign(a.dataset,{moves:'12',captured:'3',doubles:'1',bestChain:'2',gifts:'0'});h.render();
 assert.equal(h.el('result-title').children[0].children.length,2);
 assert.equal(a.hidden,true);assert.deepEqual(a.dataset,{moves:'12',captured:'3',doubles:'1',bestChain:'2',gifts:'0'});assert.equal(h.el('rm-result-note').hidden,true);
 const missing=await fixture({outcome:'draw',next:false,level:null});missing.el('match-analysis').textContent='Original analysis';missing.render();
 assert.equal(missing.el('match-analysis').hidden,true);assert.equal(missing.el('match-analysis').textContent,'Original analysis');assert.equal(missing.el('rm-result-note').hidden,true);assert.equal(missing.el('againBtn').textContent,'Rematch');
 const local=await fixture({outcome:'draw',next:false,level:null,mode:'pvp'});local.render();assert.equal(local.el('match-analysis').hidden,true);
});
test('P4.7d bundled emblems and CSS are non-victory only and finite',()=>{
 const css=read('src/neon-p47d-outcomes.css');
 assert.ok(css.split('\n').filter(l=>l.trim().startsWith(':root')).every(l=>l.includes('[data-edition="core"] #overlay.flex')&&l.includes('[data-outcome="draw"]')));
 assert.ok(css.includes('prefers-reduced-motion:no-preference')&&css.includes('pointer-events:none')&&!css.includes('infinite'));
 for(const kind of ['defeat','draw'])assert.ok(read('src/skin-art/neon-'+kind+'-emblem.svg').includes('viewBox="0 0 240 240"'));
 assert.ok(read('src/main.js').includes("import './neon-p47d-outcomes.css';"));
});
