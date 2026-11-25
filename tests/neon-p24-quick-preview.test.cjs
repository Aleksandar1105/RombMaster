const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,'../src',name),'utf8');
test('P2.4 board miniatures match active diamond cells and four initial owners',()=>{
 const html=read('index.html');
 for(const size of [4,6,8,10]){
  const chunk=html.match(new RegExp('data-size="'+size+'"[^>]*>(.*?)</button>','s'))[1];
  const R=size/2;
  const cells=[...chunk.matchAll(/<rect class="rm-quick-mini-cell([^"]*)" x="(\d+)" y="(\d+)" width="1" height="1"\/>/g)];
  assert.equal(cells.length,1+2*R*(R+1));
  const seen=new Set();
  for(const [,owner,x,y] of cells){
   const c=Number(x),r=Number(y);
   assert.ok(Math.abs(c-R)+Math.abs(r-R)<=R);
   assert.ok(!seen.has(x+','+y));seen.add(x+','+y);
   assert.equal(owner,c===R&&(r===0||r===2*R)?' rm-quick-mini-x':r===R&&(c===0||c===2*R)?' rm-quick-mini-o':'');
  }
 }
});
test('P2.4 uses existing renderer and isolates responsive preview to Quick Play',()=>{
 const css=read('neon-p24-quick-preview.css'),main=read('main.js');
 assert.match(main,/import '\.\/neon-p24-quick-preview\.css';/);
 assert.match(main,/preview.width = preview.height = 480/);
 assert.match(main,/drawOpening\(preview, \{ size \}\)/);
 assert.doesNotMatch(css,/#home-hub|#premium-hero-stage|@keyframes/);
 assert.match(css,/max-height:720px/);
 assert.match(css,/orientation:landscape/);
});
