const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p412b-gameplay-header.css');
const game=read('src/game.js');
function node(tag){
 return {tag,children:[],attrs:{},textContent:'',appendChild(n){this.children.push(n);},
 replaceChildren(...n){this.children=n;this.textContent='';},setAttribute(k,v){this.attrs[k]=v;},removeAttribute(k){delete this.attrs[k];}};
}
function setup(skin='neon',edition='core'){
 const doc={documentElement:{dataset:{skin,edition}},createElement:node};
 const start=game.indexOf('function renderCoreNeonModeHeading('),end=game.indexOf('export const Game',start);
 assert.ok(start>=0&&end>start);
 const fn=vm.runInNewContext(game.slice(start,end)+'\nrenderCoreNeonModeHeading',{document:doc});
 return {fn,element:node('div')};
}
const walk=n=>[n,...n.children.flatMap(walk)];
test('P4.12b: actual numeric target, capped meter, mission title and double goal',()=>{
 const {fn,element}=setup();
 const base={level:13,progress:'3-star goal: 9/15',target:15,earned:9,double:null};
 fn(element,base);
 assert.equal(element.attrs['data-rm-mode'],'career');
 const all=()=>walk(element);
 assert.ok(all().some(n=>n.textContent==='Level 13'));
 assert.ok(all().some(n=>n.textContent===base.progress));
 assert.equal(all().find(n=>n.tag==='progress').value,9);
 assert.equal(all().find(n=>n.tag==='progress').max,15);
 assert.equal(all().find(n=>n.tag==='progress').attrs['aria-hidden'],'true');
 fn(element,{...base,earned:18,progress:'★★★ secured'});
 assert.equal(all().find(n=>n.tag==='progress').value,15);
 fn(element,{...base,missionTitle:'Double capture',double:false,progress:'Goal: double capture'});
 assert.ok(all().some(n=>n.textContent==='Double capture'));
 assert.ok(all().some(n=>n.textContent==='Goal: double capture'));
 assert.ok(!all().some(n=>n.tag==='progress'));
 fn(element,{...base,double:true,progress:'Double capture ✓'});
 assert.ok(all().some(n=>n.textContent==='Double capture ✓'));
 assert.ok(!all().some(n=>n.tag==='progress'));
 fn(element,{level:0});
 assert.equal(element.attrs['data-rm-mode'],'quick');
 assert.ok(all().some(n=>n.textContent==='Tactical arena'));
 assert.ok(!all().some(n=>n.tag==='progress'));
});
test('P4.12b: legacy fallback and scope',()=>{
 for(const [skin,edition] of [['royal','core'],['neon','full']]){
  const {fn,element}=setup(skin,edition);element.textContent='Quick Play';
  fn(element,{level:0});assert.equal(element.textContent,'Quick Play');
  assert.equal(element.children.length,0);assert.equal(element.attrs['data-rm-mode'],undefined);
 }
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.ok(selectors.length>=10);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #view-game.active-view #match-mode[data-rm-mode]')));
 assert.doesNotMatch(css,/#canvas|#controls|#scoreboard|#turn-status|#overlay|#view-menu|url\(/);
 assert.ok(read('src/main.js').includes("import './neon-p412a-turn-status.css';\nimport './neon-p412b-gameplay-header.css';"));
 assert.ok(game.includes('renderCoreNeonModeHeading(modeLabel, { level, missionTitle: mission?.title, progress, double, earned, target });'));
});
