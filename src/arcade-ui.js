import {createArcade,arcadeMove,timeoutArcade,BLITZ_MS,ARCADE_KEY,readArcade,recordArcade,arcadeSummary} from './arcade.js';
import {Renderer} from './renderer.js';
import {nearestLegalLine,canvasPoint} from './input.js';
import {LocalSlots} from './profile.js';
export function mountArcade({documentRef=document,windowRef=window,game}){
 const el=id=>documentRef.getElementById(id);
 const page=el('arcade-page'),canvas=el('arcade-canvas');
 if(!page||!canvas)return null;
 const modeNames={puzzle:'Puzzle Master',perfect:'Perfect Move',blitz:'Blitz',survival:'Survival'};
 const renderer=new Renderer(canvas);
 let session=null,key=null,seed=1,last=null,timer=null,active=false,turnStart=0,elapsed=0,days=30;
 const now=()=>performance.now();
 const currentElapsed=()=>elapsed+(active?Math.max(0,now()-turnStart):0);
 const stopClock=()=>{if(timer!==null)clearInterval(timer);timer=null;if(active)elapsed=currentElapsed();active=false;};
 function refresh(){
  const result=readArcade(localStorage,LocalSlots.storageKey(ARCADE_KEY));
  el('arcade-period').textContent='Last '+days+' days';
  const summary=el('arcade-summary');
  if(result.status!=='ready'){summary.textContent='Performance history unavailable. Previous data preserved.';return;}
  const s=arcadeSummary(result.data,days);
  summary.textContent='Sessions '+s.sessions+' · Puzzle accuracy '+(s.accuracy===null?'—':s.accuracy+'%')+' · Match wins '+s.wins+'/'+s.games+' · Mean move time '+(s.meanSeconds===null?'—':s.meanSeconds+' s')+' · Doubles '+s.doubles+' · Best chain '+s.bestChain+' · Immediate concessions '+s.concessions+' · Survival '+s.survival;
 }
 function draw(){
  if(!session||page.hidden)return;
  renderer.resize({clientWidth:Math.min(windowRef.innerWidth-30,460),clientHeight:Math.max(440,Math.min(windowRef.innerHeight,680)),querySelector:()=>null},session.board.S);
  renderer.draw(session.board,last);
  el('arcade-score').textContent=session.puzzle?'Attempts: '+session.attempts:'You '+session.board.score[1]+' · AI '+session.board.score[0]+' · Round '+session.round;
 }
 function finish(){
  stopClock();
  const result=key===LocalSlots.storageKey(ARCADE_KEY)?recordArcade(localStorage,key,session):{status:'unavailable'};
  el('arcade-feedback').textContent=(session.outcome==='win'?'Victory!':session.outcome==='draw'?'Draw.':'Round lost.')+(result.status==='ready'?'':' · Result not saved');
  el('arcade-next').hidden=false;
  el('arcade-next').textContent=session.mode==='survival'&&session.outcome==='win'?'Next round':'Play again';
  if(session.outcome==='win')game.playCosmeticSound('win');
  refresh();
 }
 function tick(){
  if(!session||session.finished||!active)return;
  if(session.mode==='blitz'){
   const left=Math.max(0,BLITZ_MS-currentElapsed());
   el('arcade-clock').textContent='Time: '+Math.ceil(left/1000)+' s';
   if(left===0){timeoutArcade(session);finish();}
  }
 }
 function resume(){
  if(!session||session.finished||page.hidden||game.paused||active)return;
  active=true;turnStart=now();
  if(session.mode==='blitz')timer=setInterval(tick,100);
  tick();
 }
 function begin(mode,round=1){
  stopClock();session=null;key=LocalSlots.storageKey(ARCADE_KEY);last=null;elapsed=0;
  try{session=createArcade(mode,seed,round);seed=seed%1000000+1;}
  catch{el('arcade-feedback').textContent='Could not create a practice board. Try again.';return;}
  canvas.hidden=false;el('arcade-next').hidden=true;
  el('arcade-title').textContent=modeNames[mode];
  el('arcade-instruction').textContent=session.puzzle?.instruction||(mode==='blitz'?'You have 10 seconds per move. A timeout loses the round.':'Win successive rounds as board size and difficulty increase.');
  el('arcade-feedback').textContent='Your turn';
  el('arcade-clock').textContent='';draw();resume();
 }
 function leave(){stopClock();session=null;key=null;last=null;canvas.hidden=true;el('arcade-next').hidden=true;el('arcade-clock').textContent='';el('arcade-score').textContent='';el('arcade-title').textContent='Choose a challenge';el('arcade-instruction').textContent='Practice without changing Career or Daily progress.';el('arcade-feedback').textContent='';}
 page.querySelectorAll('[data-arcade]').forEach(b=>b.onclick=()=>begin(b.dataset.arcade));
 el('arcade-next').onclick=()=>{if(!session?.finished)return;begin(session.mode,session.mode==='survival'&&session.outcome==='win'?session.round+1:1);};
 el('arcade-period').onclick=()=>{days=days===30?7:30;refresh();};
 canvas.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||!session||session.finished||!active||game.paused||page.hidden)return;
  if(key!==LocalSlots.storageKey(ARCADE_KEY)){leave();return;}
  const point=canvasPoint(canvas,event.clientX,event.clientY);if(!point)return;
  const move=nearestLegalLine(session.board,renderer.CELL,renderer.offX,renderer.offY,point.x,point.y);if(!move)return;
  event.preventDefault();
  const time=currentElapsed();stopClock();
  const result=arcadeMove(session,move,time);last=result.last||last;elapsed=0;draw();
  if(result.status==='retry')el('arcade-feedback').textContent=session.puzzle.retry;
  else if(result.status==='ready'){el('arcade-feedback').textContent=result.points?'Capture! Play again.':'Your turn';game.playCosmeticSound(result.points?'capture':'move');}
  if(session.finished)finish();else resume();
 });
 windowRef.addEventListener('resize',draw);
 return {enter(){leave();refresh();},leave,activity(){if(game.paused)stopClock();else resume();}};
}
