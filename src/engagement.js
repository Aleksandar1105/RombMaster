// Offline-only rewards. No payment, entitlement, gameplay advantage or network trust.
import {validDateKey} from './daily-challenge.js';
const DAY=86400000, EPOCH=Date.parse('2026-01-01T00:00:00Z');
const dayNumber=d=>Math.floor((Date.parse(d+'T00:00:00Z')-EPOCH)/DAY);
const dateFor=n=>new Date(EPOCH+n*DAY).toISOString().slice(0,10);
export function periodKeys(date){
 if(!validDateKey(date)||dayNumber(date)<0)throw Error('Invalid reward date');
 const n=dayNumber(date), weekday=new Date(date+'T00:00:00Z').getUTCDay();
 return {day:date,week:dateFor(n-((weekday+6)%7)),season:Math.floor(n/30),seasonEnd:dateFor(Math.floor(n/30)*30+29)};
}
const KEYS=['sessions','puzzles','perfect','blitzWins','survivalWins','infinityWins','doubles','cells','bestChain','survivalBest','infinityBest','wins'];
const blank=()=>Object.fromEntries(KEYS.map(k=>[k,0]));
const bounded=n=>Number.isSafeInteger(n)&&n>=0&&n<=1000000000;
const validCounters=x=>x&&KEYS.every(k=>bounded(x[k]));
const defs=(pairs,metric,prefix)=>pairs.map(([n,title])=>({id:prefix+'-'+n,title,metric,target:n}));
export const ARCADE_ACHIEVEMENTS=Object.freeze([
 ...defs([[1,'Arena Debut'],[10,'Arena Regular'],[50,'Arena Veteran'],[200,'Arena Legend']],'sessions','session'),
 ...defs([[5,'Puzzle Solver'],[25,'Puzzle Scholar'],[100,'Puzzle Master']],'puzzles','puzzle'),
 ...defs([[5,'Perfect Vision'],[25,'Perfect Precision'],[100,'Flawless Tactician']],'perfect','perfect'),
 ...defs([[1,'Blitz Starter'],[10,'Lightning Reflexes'],[50,'Blitz Champion']],'blitzWins','blitz'),
 ...defs([[3,'Survivor'],[5,'Hard Arena'],[10,'Last Stand']],'survivalBest','survival'),
 ...defs([[1,'Beyond the Master'],[10,'Infinity Explorer'],[50,'Infinity Legend']],'infinityBest','infinity'),
 ...defs([[5,'Double Master'],[25,'Double Expert'],[100,'Double Legend']],'doubles','double'),
 ...defs([[3,'Triple Chain'],[4,'Quad Chain'],[8,'Chain Master']],'bestChain','chain'),
 ...defs([[500,'Cell Collector']],'cells','cells')
].map(Object.freeze));
export const DAILY_MISSIONS=Object.freeze([
 {id:'daily-play',title:'Complete 3 Arena sessions',metric:'sessions',target:3,xp:30},
 {id:'daily-puzzle',title:'Solve 2 tactical puzzles',metric:'puzzles',target:2,xp:30},
 {id:'daily-double',title:'Make 3 double captures',metric:'doubles',target:3,xp:40}
]);
export const WEEKLY_MISSIONS=Object.freeze([
 {id:'weekly-play',title:'Complete 15 Arena sessions',metric:'sessions',target:15,xp:100},
 {id:'weekly-win',title:'Win 5 competitive Arena rounds',metric:'wins',target:5,xp:100},
 {id:'weekly-puzzle',title:'Solve 10 tactical puzzles',metric:'puzzles',target:10,xp:150}
]);
export const PASS_TIERS=Object.freeze([
 {xp:50,free:'Spark Crest',premium:'Seasonal avatar'},
 {xp:150,free:'Strategist Crest',premium:'Animated avatar frame'},
 {xp:300,free:'Crystal Crest',premium:'Exclusive victory effect'},
 {xp:500,free:'Master Crest',premium:'Exclusive board skin'},
 {xp:800,free:'Season Champion',premium:'Collector skin bundle'}
]);
function newPeriod(key){return {key,counters:blank(),earned:[]};}
export function freshEngagement(date){
 const k=periodKeys(date);
 return {version:1,lastDate:date,lifetime:blank(),daily:newPeriod(k.day),weekly:newPeriod(k.week),season:{id:k.season,xp:0},collection:[]};
}
function validPeriod(p,defs){return p&&validDateKey(p.key)&&validCounters(p.counters)&&Array.isArray(p.earned)&&
 new Set(p.earned).size===p.earned.length&&p.earned.every(id=>defs.some(d=>d.id===id&&p.counters[d.metric]>=d.target));}
export function validEngagement(e){
 if(!e||e.version!==1||!validDateKey(e.lastDate)||dayNumber(e.lastDate)<0||!validCounters(e.lifetime)||
 !validPeriod(e.daily,DAILY_MISSIONS)||!validPeriod(e.weekly,WEEKLY_MISSIONS)||
 !e.season||!bounded(e.season.id)||!bounded(e.season.xp)||!Array.isArray(e.collection)||e.collection.length>5000||
 new Set(e.collection).size!==e.collection.length)return false;
 const k=periodKeys(e.lastDate);
 return e.daily.key===k.day&&e.weekly.key===k.week&&e.season.id===k.season&&
 e.collection.every(id=>typeof id==='string'&&/^(0|[1-9][0-9]{0,8}):[1-5]$/.test(id)&&Number(id.split(':')[0])<=k.season);
}
export function rollEngagement(e,date){
 if(!validEngagement(e))throw Error('Invalid rewards');
 if(date<e.lastDate)return null;
 const k=periodKeys(date);
 return {...e,lastDate:date,daily:e.daily.key===k.day?{...e.daily,counters:{...e.daily.counters},earned:[...e.daily.earned]}:newPeriod(k.day),
 weekly:e.weekly.key===k.week?{...e.weekly,counters:{...e.weekly.counters},earned:[...e.weekly.earned]}:newPeriod(k.week),
 lifetime:{...e.lifetime},season:e.season.id===k.season?{...e.season}:{id:k.season,xp:0},collection:[...e.collection]};
}
function add(c,r){
 const puzzle=['puzzle','perfect','infinity'].includes(r.mode),win=r.outcome==='win';
 c.sessions++;c.puzzles+=Number(puzzle&&win);c.perfect+=Number(r.mode==='perfect'&&win);
 c.blitzWins+=Number(r.mode==='blitz'&&win);c.survivalWins+=Number(r.mode==='survival'&&win);
 c.infinityWins+=Number(r.mode==='infinity'&&win);c.wins+=Number(!puzzle&&win);
 c.doubles+=r.doubles;c.cells+=r.cells;c.bestChain=Math.max(c.bestChain,r.bestChain);
 if(r.mode==='survival'&&win)c.survivalBest=Math.max(c.survivalBest,r.round);
 if(r.mode==='infinity'&&win)c.infinityBest=Math.max(c.infinityBest,r.round);
}
export function applyEngagement(e,r){
 const next=rollEngagement(e,r.date);if(!next)return null;
 // Infinity levels are strictly sequential; replay cannot grant duplicate progress.
 if(r.mode==='infinity'&&(r.outcome!=='win'||r.round!==next.lifetime.infinityBest+1))return null;
 for(const c of [next.lifetime,next.daily.counters,next.weekly.counters])add(c,r);
 next.season.xp+=r.outcome==='win'?20:10;
 for(const [p,defs] of [[next.daily,DAILY_MISSIONS],[next.weekly,WEEKLY_MISSIONS]]){
  for(const d of defs)if(p.counters[d.metric]>=d.target&&!p.earned.includes(d.id)){p.earned.push(d.id);next.season.xp+=d.xp;}
 }
 for(let i=0;i<PASS_TIERS.length;i++){
  const id=next.season.id+':'+(i+1);
  if(next.season.xp>=PASS_TIERS[i].xp&&!next.collection.includes(id))next.collection.push(id);
 }
 return validEngagement(next)?next:null;
}
// Upgrade retained history once; no retroactive assumption about pruned sessions.
export function migrateEngagement(history,date){
 const old=history.filter(r=>validDateKey(r.date)&&dayNumber(r.date)>=0&&r.date<=date).sort((a,b)=>a.date.localeCompare(b.date));
 let e=freshEngagement(old[0]?.date||date);
 for(const r of old){const n=applyEngagement(e,r);if(!n)throw Error('Invalid legacy rewards');e=n;}
 return rollEngagement(e,date);
}
export function engagementView(e,date){
 const current=rollEngagement(e,date);if(!current)return null;
 const missions=(p,defs)=>defs.map(d=>({...d,progress:Math.min(d.target,p.counters[d.metric]),complete:p.earned.includes(d.id)}));
 return {daily:missions(current.daily,DAILY_MISSIONS),weekly:missions(current.weekly,WEEKLY_MISSIONS),
  achievements:ARCADE_ACHIEVEMENTS.map(a=>({...a,progress:Math.min(a.target,current.lifetime[a.metric]),earned:current.lifetime[a.metric]>=a.target})),
  season:current.season,seasonEnd:periodKeys(date).seasonEnd,collection:current.collection,
  tiers:PASS_TIERS.map((t,i)=>({...t,earned:current.collection.includes(current.season.id+':'+(i+1))})),
  infinityNext:current.lifetime.infinityBest+1};
}
