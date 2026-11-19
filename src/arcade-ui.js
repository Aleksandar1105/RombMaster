import {createArcade,arcadeMove,arcadeReply,timeoutArcade,BLITZ_MS,ARCADE_KEY,readArcade,recordArcade,arcadeSummary} from './arcade.js';
import {Renderer} from './renderer.js';
import {nearestLegalLine,canvasPoint} from './input.js';
import {LocalSlots,ProfileStore,careerSummary} from './profile.js';
import {localDateKey} from './daily-challenge.js';
import {migrateEngagement,engagementView,PASS_TIERS} from './engagement.js';
export function mountArcade({documentRef=document,windowRef=window,game,confirmLeave}){
 const el=id=>documentRef.getElementById(id);
 const page=el('arcade-page'),canvas=el('arcade-canvas');
 if(!page||!canvas)return null;
 const modeNames={puzzle:'Puzzle Master',perfect:'Perfect Move',blitz:'Blitz',survival:'Survival',infinity:'Infinity'};
 const modeButtons=page.querySelectorAll('[data-arcade]');
 function highlightMode(mode){
  for(const button of modeButtons)button.setAttribute('aria-pressed',String(button.dataset.arcade===mode));
 }
 const renderer=new Renderer(canvas);
 let selectedMode=null;
 const descriptions={puzzle:'Find the correct tactical move.',perfect:'Choose the move with the biggest capture.',blitz:'Ten seconds per move. A timeout loses the round.',survival:'Win consecutive rounds as difficulty increases.',infinity:'Advance through endless stages after Career Level 100.'};
 const picker=el('arcade-picker'), play=el('arcade-play'), progress=el('arcade-progress'), start=el('arcade-start');
 function show(view){picker.hidden=view!=='picker';play.hidden=view!=='play';progress.hidden=view!=='progress';page.dataset.arenaView=view;}
 function select(mode){selectedMode=mode;highlightMode(mode);el('arcade-selection-title').textContent=modeNames[mode];el('arcade-selection-description').textContent=descriptions[mode];start.disabled=false;}
 let session=null,canAdvance=false,key=null,seed=1,last=null,timer=null,active=false,turnStart=0,elapsed=0,days=30;
 const categories=[['stats','Statistics',null],['daily','Daily missions','daily-arena-missions'],['weekly','Weekly missions','weekly-arena-missions'],['season','Season Pass','season-tiers'],['crests','Seasonal crests','season-collection'],['achievements','Achievements','arcade-achievements']];
 let category=0,listPage=0;
 function renderPages(){
  const [id,label,listId]=categories[category], rows=listId?Array.from(el(listId).children):[];
  const pageSize=windowRef.innerHeight<540?2:windowRef.innerHeight<700?3:5;
  const count=Math.max(1,Math.ceil(rows.length/pageSize));
  listPage=Math.min(listPage,count-1);
  for(const pane of progress.querySelectorAll('[data-progress-pane]'))pane.hidden=pane.dataset.progressPane!==id;
  el('arena-category-label').textContent=label+' · '+(category+1)+' / '+categories.length;
  el('arena-category-prev').disabled=category===0;
  el('arena-category-next').disabled=category===categories.length-1||el('arcade-rewards').hidden;
  rows.forEach((row,i)=>row.hidden=i<listPage*pageSize||i>=(listPage+1)*pageSize);
  el('arena-list-nav').hidden=!listId||count===1;
  el('arena-list-label').textContent=(listPage+1)+' / '+count;
  el('arena-list-prev').disabled=listPage===0;el('arena-list-next').disabled=listPage>=count-1;
 }
 const shiftCategory=d=>{category=Math.max(0,Math.min(categories.length-1,category+d));listPage=0;renderPages();};
 el('arena-category-prev').onclick=()=>shiftCategory(-1);
 el('arena-category-next').onclick=()=>shiftCategory(1);
 el('arena-list-prev').onclick=()=>{listPage=Math.max(0,listPage-1);renderPages();};
 el('arena-list-next').onclick=()=>{listPage++;renderPages();};
 let aiTimer=null;
 function stopAI(){if(aiTimer!==null)clearTimeout(aiTimer);aiTimer=null;}
 function scheduleAI(delay=550){
  if(aiTimer!==null||!session?.aiPending||game.paused||page.hidden)return;
  page.dataset.turn='ai';el('arcade-clock').textContent=session.mode==='blitz'?'AI turn — timer paused':'';el('arcade-feedback').textContent='Opponent turn';
  aiTimer=setTimeout(()=>{
   aiTimer=null;
   if(!session?.aiPending||game.paused||page.hidden)return;
   if(key!==LocalSlots.storageKey(ARCADE_KEY)){leave();return;}
   try{const r=arcadeReply(session);last=r.last||last;draw();game.playCosmeticSound(r.points?'capture':'move');
    if(session.finished)finish();else if(session.aiPending)scheduleAI(420);else{el('arcade-feedback').textContent='Your turn';resume();}
   }catch{stopAI();el('arcade-feedback').textContent='Opponent move unavailable. Return to Arena.';}
  },delay);
 }
 const now=()=>performance.now();
 const currentElapsed=()=>elapsed+(active?Math.max(0,now()-turnStart):0);
 const stopClock=()=>{if(timer!==null)clearInterval(timer);timer=null;if(active)elapsed=currentElapsed();active=false;};
 const unlockedInfinity=()=>Boolean(ProfileStore.read().profile?.stars?.[100]);
 function rewards(data){
  const container=el('arcade-rewards');if(!container)return;
  const today=localDateKey(),infinity=el('arcade-infinity');
  if(infinity){infinity.disabled=!unlockedInfinity();infinity.title=infinity.disabled?'Win Career Level 100 to unlock':'';}
  try{
   const view=engagementView(data.engagement||migrateEngagement(data.history,today),today);
   if(!view)throw Error('Clock rollback');
   const list=(id,rows)=>{const root=el(id);root.replaceChildren(...rows.map(text=>{const li=documentRef.createElement('li');li.textContent=text;return li;}));};
   list('daily-arena-missions',view.daily.map(m=>(m.complete?'✓ ':'')+m.title+' · '+m.progress+'/'+m.target+' · '+m.xp+' XP'));
   list('weekly-arena-missions',view.weekly.map(m=>(m.complete?'✓ ':'')+m.title+' · '+m.progress+'/'+m.target+' · '+m.xp+' XP'));
   const profile=ProfileStore.read().profile,old=profile?careerSummary(profile).earnedAchievements:0;
   el('arena-achievement-count').textContent=(old+view.achievements.filter(a=>a.earned).length)+' / 50';
   list('arcade-achievements',view.achievements.map(a=>(a.earned?'🏆 ':'🔒 ')+a.title+' · '+a.progress+'/'+a.target));
   el('season-progress').textContent='Season '+(view.season.id+1)+' · '+view.season.xp+' XP · Ends '+view.seasonEnd;
   list('season-tiers',view.tiers.map(t=>(t.earned?'✓ ':'🔒 ')+t.xp+' XP · Free: '+t.free+' | Premium preview: '+t.premium));
   list('season-collection',view.collection.map(id=>{const [season,tier]=id.split(':').map(Number);return 'Season '+(season+1)+' · '+PASS_TIERS[tier-1].free;}));
   if(infinity)infinity.querySelector('small').textContent=infinity.disabled?'Win Career Level 100 to unlock':'Next stage '+(100+view.infinityNext);
  }catch{el('season-progress').textContent='Rewards unavailable. Previous data preserved.';for(const id of ['daily-arena-missions','weekly-arena-missions','arcade-achievements','season-tiers','season-collection'])el(id).replaceChildren();el('arena-achievement-count').textContent='—';}
 }
 function refresh(){
  const result=readArcade(localStorage,LocalSlots.storageKey(ARCADE_KEY));
  el('arcade-period').textContent='Last '+days+' days';
  const summary=el('arcade-summary');
  if(result.status!=='ready'){summary.textContent='Performance history unavailable. Previous data preserved.';el('arcade-rewards').hidden=true;el('arcade-infinity').disabled=true;category=0;listPage=0;renderPages();return;}
  el('arcade-rewards').hidden=false;rewards(result.data);
  const s=arcadeSummary(result.data,days);
  const stats=[['Sessions',s.sessions],['Puzzle accuracy',s.accuracy===null?'—':s.accuracy+'%'],['Match wins',s.wins+'/'+s.games],['Mean move time',s.meanSeconds===null?'—':s.meanSeconds+' s'],['Double captures',s.doubles],['Best chain',s.bestChain],['Concessions',s.concessions],['Survival round',s.survival]];
  summary.replaceChildren(...stats.map(([label,value])=>{const tile=documentRef.createElement('div');tile.className='arena-stat';const b=documentRef.createElement('b'),small=documentRef.createElement('small');b.textContent=String(value);small.textContent=label;tile.append(b,small);return tile;}));
  renderPages();
 }
 function draw(){
  if(!session||session.finished||page.hidden||play.hidden||canvas.hidden)return;
  renderer.resize({clientWidth:Math.min(play.clientWidth||windowRef.innerWidth-30,760),clientHeight:Math.max(220,Math.min(windowRef.innerHeight-260,740)),querySelector:()=>null},session.board.S);
  renderer.draw(session.board,last);
  el('arcade-score').textContent=session.puzzle?'Attempts: '+session.attempts:'You '+session.board.score[1]+' · AI '+session.board.score[0]+' · Round '+session.round;
 }
 function finish(){
  stopAI();stopClock();page.dataset.turn='finished';page.dataset.result=session.outcome==='win'?'victory':session.outcome==='draw'?'draw':'defeat';canvas.hidden=true;el('arcade-clock').textContent='';
  const result=key===LocalSlots.storageKey(ARCADE_KEY)?recordArcade(localStorage,key,session):{status:'unavailable'};
  el('arcade-feedback').textContent=(session.puzzle&&session.outcome==='win'?'Puzzle solved!':session.outcome==='win'?'Victory!':session.outcome==='draw'?'Draw.':'Round lost.')+(result.status==='ready'?'':' · Result not saved');
  canAdvance=result.status==='ready';
  el('arcade-next').hidden=session.mode==='infinity'&&!canAdvance;
  el('arcade-next').textContent=['survival','infinity'].includes(session.mode)&&session.outcome==='win'?'Next round':'Play again';
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
  if(session.aiPending){scheduleAI();return;}
  page.dataset.turn='human';active=true;turnStart=now();
  if(session.mode==='blitz')timer=setInterval(tick,100);
  tick();
 }
 function begin(mode,round=1){
  page.dataset.result='';
  stopAI();stopClock();highlightMode(null);session=null;key=LocalSlots.storageKey(ARCADE_KEY);last=null;elapsed=0;canAdvance=false;canvas.hidden=true;el('arcade-next').hidden=true;
  if(mode==='infinity'){
   if(!unlockedInfinity()){el('arcade-selection-description').textContent='Win Career level 100 first.';return;}
   try{const read=readArcade(localStorage,key);if(read.status!=='ready')throw Error();const today=localDateKey(),view=engagementView(read.data.engagement||migrateEngagement(read.data.history,today),today);if(!view)throw Error();round=view.infinityNext;}
   catch{el('arcade-selection-description').textContent='Infinity progress unavailable.';return;}
  }
  try{session=createArcade(mode,seed,round);seed=seed%1000000+1;}
  catch{el('arcade-selection-description').textContent='Could not create a practice board. Try again.';return;}
  highlightMode(mode);show('play');canvas.hidden=false;el('arcade-next').hidden=true;
  el('arcade-title').textContent=(session.puzzle?.title||modeNames[mode])+(mode==='infinity'?' · Stage '+(100+round):'');
  el('arcade-instruction').textContent=session.puzzle?.instruction||(mode==='blitz'?'You have 10 seconds per move. A timeout loses the round.':'Win successive rounds as board size and difficulty increase.');
  el('arcade-feedback').textContent='Your turn';
  el('arcade-clock').textContent='';draw();resume();
 }
 function leave(){page.dataset.result='';stopAI();stopClock();selectedMode=null;show('picker');start.disabled=true;el('arcade-selection-title').textContent='Choose a challenge';el('arcade-selection-description').textContent='Select a mode to see its rules.';highlightMode(null);session=null;key=null;last=null;canvas.hidden=true;el('arcade-next').hidden=true;el('arcade-clock').textContent='';el('arcade-score').textContent='';el('arcade-title').textContent='Choose a challenge';el('arcade-instruction').textContent='Practice without changing Career or Daily progress.';el('arcade-feedback').textContent='';}
 modeButtons.forEach(b=>b.onclick=()=>select(b.dataset.arcade));
 start.onclick=()=>{if(selectedMode)begin(selectedMode);};
 function back(){if(page.hidden||page.dataset.arenaView==='picker')return false;
  if(session&&!session.finished){
   confirmLeave?.({heading:'Leave Challenge?',detail:'Progress in this unfinished round will be lost.',confirmLabel:'Leave Challenge',cancelLabel:'Continue Playing',onConfirm:()=>{leave();refresh();}});return true;
  }
  leave();refresh();return true;
 }
 el('arcade-back').onclick=back;
 el('arcade-progress-open').onclick=()=>{leave();category=0;listPage=0;show('progress');refresh();};
 el('arcade-progress-back').onclick=()=>{leave();refresh();};
 el('arcade-next').onclick=()=>{if(!session?.finished)return;begin(session.mode,session.mode==='survival'&&session.outcome==='win'?session.round+1:1);};
 el('arcade-period').onclick=()=>{days=days===30?7:30;refresh();};
 canvas.addEventListener('pointerdown',event=>{
  if(!event.isPrimary||event.button!==0||!session||session.finished||!active||game.paused||page.hidden)return;
  if(key!==LocalSlots.storageKey(ARCADE_KEY)){leave();return;}
  const point=canvasPoint(canvas,event.clientX,event.clientY);if(!point)return;
  const move=nearestLegalLine(session.board,renderer.CELL,renderer.offX,renderer.offY,point.x,point.y);if(!move)return;
  event.preventDefault();
  const time=currentElapsed();stopClock();
  const result=arcadeMove(session,move,time,Math.random,{deferAI:true});last=result.last||last;elapsed=0;draw();
  if(result.status==='retry')el('arcade-feedback').textContent=session.puzzle.retry;
  else if(result.status==='ready'){el('arcade-feedback').textContent=result.points?'Capture! Play again.':'Your turn';game.playCosmeticSound(result.points?'capture':'move');}
  if(session.finished)finish();else resume();
 });
 windowRef.addEventListener('resize',()=>{draw();if(!progress.hidden)renderPages();});
 return {enter(){leave();refresh();},leave,back,activity(){if(game.paused){stopAI();stopClock();}else resume();}};
}
