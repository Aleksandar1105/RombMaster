const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
async function load() {
  const context = vm.createContext({});
  const modules = new Map();
  function get(name) {
    if (!modules.has(name)) {
      const source = fs.readFileSync(path.resolve(__dirname,'../src',name),'utf8');
      modules.set(name,new vm.SourceTextModule(source,{context,identifier:name}));
    }
    return modules.get(name);
  }
  const renderer=get('renderer.js'), board=get('board.js');
  await renderer.link(spec=>get(spec.replace('./','')));
  await renderer.evaluate();
  await board.link(spec=>get(spec.replace('./','')));
  await board.evaluate();
  return {Renderer:renderer.namespace.Renderer,Board:board.namespace.Board,
    skins:get('skins.js').namespace.SKINS};
}
function fakeCanvas() {
  const strokes=[], fills=[];
  let pts=[];
  const stack=[];
  const ctx={
    save(){stack.push({lineWidth:this.lineWidth,strokeStyle:this.strokeStyle,fillStyle:this.fillStyle,shadowBlur:this.shadowBlur});},
    restore(){Object.assign(this,stack.pop());},
    beginPath(){pts=[];},moveTo(x,y){pts.push([x,y]);},lineTo(x,y){pts.push([x,y]);},
    stroke(){strokes.push({pts:pts.slice(),style:this.strokeStyle,width:this.lineWidth});},
    fill(){fills.push('path');},fillRect(){fills.push('rect');},setTransform(){},translate(){},
    arc(){},arcTo(){},rect(){},clip(){},closePath(){},bezierCurveTo(){},setLineDash(){},
    createLinearGradient(...coords){return {coords,stops:[],addColorStop(at,color){this.stops.push([at,color]);}};}
  };
  return {width:320,height:320,getContext:()=>ctx,strokes,fills};
}
test('all six finished skins preserve one centered two-color line in both directions',async()=>{
  const {Renderer,Board,skins}=await load();
  for (const skin of skins) {
    const canvas=fakeCanvas(), renderer=new Renderer(canvas,skin), board=new Board(4);
    renderer.CELL=60; renderer.offX=renderer.offY=10;
    for(const [r,c,p] of [[1,2,1],[2,2,0],[2,3,1]]){
      board.owner[r][c]=p;
      board.h[r][c]=board.h[r+1][c]=board.v[r][c]=board.v[r][c+1]=true;
    }
    const snapshot=JSON.stringify(board);
    renderer.draw(board,null);
    assert.equal(JSON.stringify(board),snapshot);
    for(const [points,colors] of [
      [[[130,130],[190,130]],[skin.colors.x,skin.colors.o]],
      [[[190,130],[190,190]],[skin.colors.o,skin.colors.x]]
    ]) {
      const edges=canvas.strokes.filter(s=>JSON.stringify(s.pts)===JSON.stringify(points));
      assert.equal(edges.length,1,skin.id);
      assert.equal(edges[0].width,1.6);
      assert.equal(edges[0].style.stops[0][1],colors[0]);
      assert.equal(edges[0].style.stops[3][1],colors[1]);
    }
    assert.ok(canvas.fills.length>0);
  }
});
test('skin effects are distinct, bounded and do not add any game rules',async()=>{
  const {skins}=await load();
  assert.equal(new Set(skins.map(s=>s.finish.material)).size,6);
  assert.equal(skins[0].finish.material,'inset');
  assert.equal(skins[0].finish.glow,0);
  assert.ok(skins.every(s=>s.finish.particles>=8&&s.finish.particles<=20));
});
