const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
const css=read('src/neon-p410c-board-controls.css');
const source=read('src/renderer.js');
test('P4.10c: controls only, four columns and 44px minimum',()=>{
 const selectors=css.split('\n').filter(l=>l.trim().startsWith(':root'));
 assert.equal(selectors.length,7);
 assert.ok(selectors.every(l=>l.includes('[data-skin="neon"][data-edition="core"] #view-game.active-view #controls')));
 assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
 assert.ok(css.includes('min-height:44px!important'));
 assert.ok(!/#canvas|#view-menu|#overlay|animation:|pointer-events:/.test(css));
 assert.ok(read('src/main.js').includes("import './neon-p410c-board-controls.css';"));
});
test('P4.10c: real resize body preserves square canvas, DPR and legacy scope',()=>{
 const start=source.indexOf('  resize(viewElement, boardS) {');
 const end=source.indexOf('  // P4.3:',start);
 assert.ok(start>=0 && end>start);
 const resize=vm.runInNewContext('(function '+source.slice(start,end).trim()+')',{
  window:{innerWidth:390,innerHeight:844,devicePixelRatio:3},
  getComputedStyle:v=>({paddingLeft:v.left+'px',paddingRight:v.right+'px'})
 });
 const run=(width,height,active,left=10,right=10)=>{
  const canvas={style:{}};
  const ctx={setTransform(){},scale(){}};
  const obj={canvas,ctx};
  const v={clientWidth:width,clientHeight:height,left,right,matches:()=>active,querySelector:()=>({getBoundingClientRect:()=>({height:20})})};
  resize.call(obj,v,9);
  return {size:parseFloat(canvas.style.width),pixel:canvas.width,square:canvas.width===canvas.height,cell:obj.CELL,off:obj.offX};
 };
 const current=run(390,844,true);
 assert.equal(current.size,362);assert.equal(current.pixel,1086);assert.equal(current.square,true);
 assert.equal(current.cell,(362-14)/9);assert.equal(current.off,7);
 assert.equal(run(390,844,false).size,342);
 assert.equal(run(390,844,true,30,30).size,322);
 assert.equal(run(844,390,true).size,190);
 assert.equal(run(900,1300,true).size,520);
});
