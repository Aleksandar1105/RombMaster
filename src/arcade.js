import {Board} from './board.js';
import {AI} from './ai.js';
import {createDailyPuzzle,evaluateDailyMove,localDateKey} from './daily-challenge.js';
import {CONSTANTS} from './constants.js';
import {validEngagement,migrateEngagement,applyEngagement} from './engagement.js';
export const ARCADE_KEY='rombmaster_arcade_v1';
export const ARCADE_MODES=Object.freeze(['puzzle','perfect','blitz','survival','infinity']);
const X=CONSTANTS.X,O=CONSTANTS.O;
const same=(a,b)=>a&&b&&a.t===b.t&&a.r===b.r&&a.c===b.c;
export const BLITZ_MS=10000;
export function captureValue(board,move){
 if(!board.getFreeMoves().some(m=>same(m,move)))return -1;
 return board.clone().makeMove(move.t,move.r,move.c,X).points;
}
export function practicePuzzle(mode,seed,date=localDateKey()){
 if(!['puzzle','perfect'].includes(mode)||!Number.isSafeInteger(seed)||seed<1||seed>1000000)throw Error('Invalid practice');
 if(mode==='perfect'){
  for(let i=0;i<4;i++){
   const p=createDailyPuzzle(date,1,seed+i);
   if(p.type==='double')return {...p, title:'Perfect Move',instruction:'Find a line that captures the maximum number of cells.'};
  }
  throw Error('Practice unavailable');
 }
 return createDailyPuzzle(date,seed%2,seed);
}
export function createArcade(mode,seed=1,round=1,date=localDateKey()){
 if(!ARCADE_MODES.includes(mode)||!Number.isSafeInteger(round)||round<1)throw Error('Invalid arcade mode');
 if(mode==='infinity'&&round>1000000)throw Error('Infinity stage limit');
 const puzzle=mode==='infinity'?createDailyPuzzle('2026-01-01',Math.floor((round-1)/2)%2,round):['puzzle','perfect'].includes(mode)?practicePuzzle(mode,seed,date):null;
 const size=mode==='blitz'?4:round<=2?4:round<=4?6:8;
 const board=puzzle?.board||new Board(size);
 const maxCapture=mode==='perfect'?Math.max(...board.getFreeMoves().map(m=>captureValue(board,m))):0;
 return {mode,round,puzzle,board,maxCapture,finished:false,outcome:null,
  attempts:0,correct:0,cells:0,doubles:0,chain:0,bestChain:0,concessions:0,decisionMs:0};
}
export function timeoutArcade(s){
 if(s.mode!=='blitz'||s.finished)return false;
 s.finished=true;s.outcome='loss';return true;
}
export function arcadeMove(s,move,elapsed=0,random=Math.random){
 if(s.finished||!s.board.getFreeMoves().some(m=>same(m,move)))return {status:'invalid'};
 if(s.mode==='blitz'&&elapsed>=BLITZ_MS){timeoutArcade(s);return {status:'timeout'};}
 s.attempts++;s.decisionMs+=Math.max(0,Math.min(600000,Math.round(Number.isFinite(elapsed)?elapsed:0)));
 if(s.puzzle){
  const correct=s.mode==='perfect'?captureValue(s.board,move)===s.maxCapture:evaluateDailyMove(s.puzzle,move).correct;
  if(!correct)return {status:'retry'};
  const result=s.board.makeMove(move.t,move.r,move.c,X);
  s.correct++;s.cells+=result.points;s.doubles+=Number(result.points===2);s.bestChain=result.points;
  s.finished=true;s.outcome='win';return {status:'complete',last:move,points:result.points};
 }
 const result=s.board.makeMove(move.t,move.r,move.c,X);
 s.cells+=result.points;s.doubles+=Number(result.points===2);
 s.chain=result.points?s.chain+result.points:0;s.bestChain=Math.max(s.bestChain,s.chain);
 let last=move;
 if(!result.points){
  const diff=s.mode==='blitz'?'normal':s.round<=2?'easy':s.round<=4?'normal':'hard';
  let first=true;
  while(!s.board.isGameOver()){
   const reply=AI.getBestMove(s.board,diff,null,random);
   if(!reply)throw Error('AI could not find a legal move');
   const r=s.board.makeMove(reply.t,reply.r,reply.c,O);last=reply;
   if(first&&r.points)s.concessions++;first=false;
   if(!r.points)break;
  }
 }
 if(s.board.isGameOver()){
  s.finished=true;s.outcome=s.board.score[X]>s.board.score[O]?'win':s.board.score[X]===s.board.score[O]?'draw':'loss';
 }
 return {status:s.finished?'complete':'ready',last,points:result.points};
}
const fresh=()=>({version:1,history:[]});
const counter=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
const validRow=r=>r&&ARCADE_MODES.includes(r.mode)&&['win','loss','draw'].includes(r.outcome)&&
 /^\d{4}-\d{2}-\d{2}$/.test(r.date)&&['round','attempts','correct','cells','doubles','bestChain','concessions','decisionMs'].every(k=>counter(r[k]))&&r.round>=1&&r.correct<=r.attempts&&r.doubles<=r.cells;
export function readArcade(storage,key){
 if(!key)return {status:'unavailable'};
 try{
  const raw=storage.getItem(key);if(raw===null)return {status:'ready',data:fresh()};
  if(raw.length>500000)return {status:'invalid'};
  const d=JSON.parse(raw);
  if(d.version!==1||!Array.isArray(d.history)||d.history.length>300||!d.history.every(validRow)||(d.engagement!==undefined&&!validEngagement(d.engagement)))return {status:'invalid'};
  return {status:'ready',data:d};
 }catch{return {status:'unavailable'};}
}
export function recordArcade(storage,key,s,date=localDateKey()){
 if(!s.finished||s.recorded)return {status:'ignored'};
 const read=readArcade(storage,key);if(read.status!=='ready')return read;
 const row={mode:s.mode,outcome:s.outcome,date};
 for(const k of ['round','attempts','correct','cells','doubles','bestChain','concessions','decisionMs'])row[k]=s[k];
 if(!validRow(row))return {status:'invalid'};
 try{
  const previous=read.data.engagement||migrateEngagement(read.data.history,date);
  const engagement=applyEngagement(previous,row);
  if(!engagement)return {status:'clock-or-progression-invalid'};
  const data={version:1,history:[...read.data.history,row].slice(-300),engagement};
  storage.setItem(key,JSON.stringify(data));s.recorded=true;return {status:'ready',data};
 }catch{return {status:'unavailable'};}
}
export function arcadeSummary(data,days=30,date=localDateKey()){
 const end=Date.parse(date+'T00:00:00Z'),start=end-(days-1)*86400000;
 const rows=(data?.history||[]).filter(r=>{const t=Date.parse(r.date+'T00:00:00Z');return t>=start&&t<=end;});
 const puzzles=rows.filter(r=>['puzzle','perfect','infinity'].includes(r.mode)),games=rows.filter(r=>!puzzles.includes(r));
 const sum=(a,k)=>a.reduce((n,r)=>n+r[k],0);
 const attempts=sum(puzzles,'attempts'),moves=sum(games,'attempts');
 return {sessions:rows.length,puzzles:puzzles.length,accuracy:attempts?Math.round(100*sum(puzzles,'correct')/attempts):null,
 wins:games.filter(r=>r.outcome==='win').length,games:games.length,
 meanSeconds:moves?Math.round(sum(games,'decisionMs')/moves/100)/10:null,
 doubles:sum(rows,'doubles'),bestChain:Math.max(0,...rows.map(r=>r.bestChain)),
 concessions:sum(games,'concessions'),survival:Math.max(0,...rows.filter(r=>r.mode==='survival'&&r.outcome==='win').map(r=>r.round))};
}
