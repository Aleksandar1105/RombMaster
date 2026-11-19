// Cosmetic settings only: never modify board ownership, saves, scores or AI.
import { CONSTANTS } from './constants.js';
export const SKIN_KEY = 'rombmaster_skin_v1';
const items = [
  ['neon','Neon Arena','Included','#071729','#FB7185','#22D3EE','#a5c5df','#a775fa','#f6c86a','#f8fafc','inset'],
  ['royal','Royal Gold','Premium preview — store not available yet','#17130d','#f8cd69','#eaedfa','#bda77b','#d9ae50','#ffdc85','#ede2c6','full'],
  ['cyber','Cyberpunk','Complete 7 Daily Challenges','#180b28','#ff38b8','#b0f83d','#c3a8ed','#9568ff','#ffcb4e','#e5d6ff','full'],
  ['ice','Ice & Fire','Reach Career Level 15','#111d2c','#ff813c','#78dfff','#aebcc9','#789cb7','#fbd16b','#e1f0ff','full'],
  ['wood','Classic Wood','Win 25 Career games','#39261c','#ffcc8b','#8adbc6','#dbc4a7','#ad8051','#ffe09b','#f0dcc4','full'],
  ['white','Minimal White','Reach Career Level 5','#f4f5f7','#b72b52','#17679a','#667587','#65758b','#946100','#536274','full'],
];
// Surface finish, symbol weight and lighting are cosmetic only.
const finishes = Object.freeze({
  neon: Object.freeze({material:'inset', symbolWeight:.105, glow:0, frame:'round', particles:12, effect:'neon-pulse', duration:520}),
  royal: Object.freeze({material:'metal', symbolWeight:.086, glow:4, frame:'bevel', particles:18, effect:'spark', duration:580}),
  cyber: Object.freeze({material:'circuit', symbolWeight:.079, glow:8, frame:'angular', particles:20, effect:'scan', duration:380}),
  ice: Object.freeze({material:'crystal', symbolWeight:.085, glow:5, frame:'bevel', particles:16, effect:'shard', duration:480}),
  wood: Object.freeze({material:'grain', symbolWeight:.095, glow:0, frame:'round', particles:10, effect:'dust', duration:340}),
  white: Object.freeze({material:'matte', symbolWeight:.085, glow:0, frame:'round', particles:8, effect:'ripple', duration:280}),
});
// Rarity is presentation metadata, never a purchase entitlement.
const catalog = Object.freeze({
  neon: Object.freeze({ rarity:'Default', description:'Crystalline neon energy', effect:'Neon pulse' }),
  royal: Object.freeze({ rarity:'Epic', description:'Black marble, gold and platinum', effect:'Golden sparks', victory:'Royal crown' }),
  cyber: Object.freeze({ rarity:'Epic', description:'Angular digital circuitry', effect:'Scan wave' }),
  ice: Object.freeze({ rarity:'Rare', description:'Embers meet crystalline ice', effect:'Crystal shards' }),
  wood: Object.freeze({ rarity:'Rare', description:'Handcrafted natural wood', effect:'Wood dust' }),
  white: Object.freeze({ rarity:'Rare', description:'Clean matte minimalism', effect:'Gentle ripple' }),
});
export const SKINS = Object.freeze(items.map(([id,name,condition,bg,x,o,dot,accent,lastMove,linePlayed,fill]) =>
  Object.freeze({id,name,condition,fill,accent, catalog:catalog[id], finish:finishes[id], colors:Object.freeze({...CONSTANTS.COLORS,bg,x,o,dot,lastMove,linePlayed,glow:lastMove,lineActive:dot})})));

// Seasonal previews are separate from the six progression skins. No client-side sales/grants.
const seasonalItems = [
  [
    "frozen-christmas",
    "Frozen Christmas",
    299,
    "12-01",
    "01-10",
    "#092336",
    "#f08286",
    "#88edff",
    "#d3f3fc",
    "#b3e3fe",
    "#fbe3a1",
    "ice",
    "Snow crystals",
    "❄"
  ],
  [
    "golden-dragon",
    "Golden Dragon",
    399,
    "02-01",
    "02-21",
    "#30100f",
    "#ff7c79",
    "#ffd46b",
    "#f9e4aa",
    "#eaa24a",
    "#ffe2a0",
    "royal",
    "Dragon embers",
    "◇"
  ],
  [
    "spring-blossom",
    "Spring Blossom",
    299,
    "03-01",
    "04-30",
    "#222938",
    "#f7a9cc",
    "#8fe4bd",
    "#dceadf",
    "#efaad3",
    "#ffe4ac",
    "white",
    "Petal ripples",
    "✿"
  ],
  [
    "summer-paradise",
    "Summer Paradise",
    349,
    "06-01",
    "08-31",
    "#073039",
    "#ff9e81",
    "#72f4dd",
    "#b9f4eb",
    "#61d9e7",
    "#f8e1a1",
    "ice",
    "Ocean shimmer",
    "≈"
  ],
  [
    "autumn-kingdom",
    "Autumn Kingdom",
    299,
    "09-01",
    "11-30",
    "#34221b",
    "#f8af62",
    "#a3d4a4",
    "#e4c8a7",
    "#e7aa64",
    "#ffe2ad",
    "wood",
    "Amber dust",
    "❋"
  ],
  [
    "halloween-curse",
    "Halloween Curse",
    399,
    "10-15",
    "11-05",
    "#21102c",
    "#ff9b48",
    "#c5a1ff",
    "#e4d8fa",
    "#ab78e9",
    "#ffc76e",
    "cyber",
    "Mystic scan",
    "✦"
  ],
  [
    "midnight-gold",
    "Midnight Gold",
    499,
    "12-25",
    "01-15",
    "#161820",
    "#ffc976",
    "#d3e6fc",
    "#eee3cc",
    "#dfb76a",
    "#fff1b6",
    "royal",
    "Golden fireworks",
    "✧"
  ]
];
const seasonalFinishes = Object.freeze({
  "frozen-christmas": {
    "material": "frost",
    "symbolWeight": 0.087,
    "glow": 5,
    "frame": "bevel",
    "particles": 12,
    "effect": "snow",
    "duration": 620
  },
  "golden-dragon": {
    "material": "scale",
    "symbolWeight": 0.087,
    "glow": 5,
    "frame": "bevel",
    "particles": 16,
    "effect": "ember",
    "duration": 690
  },
  "spring-blossom": {
    "material": "silk",
    "symbolWeight": 0.087,
    "glow": 2,
    "frame": "bevel",
    "particles": 10,
    "effect": "petal",
    "duration": 650
  },
  "summer-paradise": {
    "material": "water",
    "symbolWeight": 0.087,
    "glow": 4,
    "frame": "bevel",
    "particles": 10,
    "effect": "wave",
    "duration": 580
  },
  "autumn-kingdom": {
    "material": "amber",
    "symbolWeight": 0.087,
    "glow": 2,
    "frame": "bevel",
    "particles": 12,
    "effect": "leaf",
    "duration": 700
  },
  "halloween-curse": {
    "material": "obsidian",
    "symbolWeight": 0.087,
    "glow": 6,
    "frame": "bevel",
    "particles": 12,
    "effect": "wisp",
    "duration": 640
  },
  "midnight-gold": {
    "material": "platinum",
    "symbolWeight": 0.087,
    "glow": 5,
    "frame": "bevel",
    "particles": 20,
    "effect": "firework",
    "duration": 760
  }
});
const seasonalDetails = Object.freeze({
  "frozen-christmas": {
    "description": "Faceted ice, snowflake filigree and winter lights",
    "victory": "Snowfall crown"
  },
  "golden-dragon": {
    "description": "Crimson lacquer, engraved gold and dragon scales",
    "victory": "Dragon flame"
  },
  "spring-blossom": {
    "description": "Rose silk, jade buds and delicate blossom petals",
    "victory": "Blossom bloom"
  },
  "summer-paradise": {
    "description": "Lagoon glass, coral and dancing light caustics",
    "victory": "Ocean ripple"
  },
  "autumn-kingdom": {
    "description": "Amber resin, copper veins and forest leaves",
    "victory": "Falling leaves"
  },
  "halloween-curse": {
    "description": "Obsidian facets, violet runes and ghostly wisps",
    "victory": "Phantom eclipse"
  },
  "midnight-gold": {
    "description": "Black enamel, champagne gold and platinum inlays",
    "victory": "Midnight fireworks"
  }
});
export const SEASONAL_SKINS = Object.freeze(seasonalItems.map(([id,name,priceCents,start,end,bg,x,o,dot,accent,lastMove,base,effect,motif]) =>
  Object.freeze({id,name,condition:'Paid cosmetic • preview only',fill:'full',accent,
    finish:Object.freeze(seasonalFinishes[id]), colors:Object.freeze({...CONSTANTS.COLORS,bg,x,o,dot,lastMove,linePlayed:dot,glow:lastMove,lineActive:dot}),
    catalog:Object.freeze({rarity:['spring-blossom','summer-paradise','autumn-kingdom'].includes(id) ? 'Epic' : 'Legendary',description:seasonalDetails[id].description,victory:seasonalDetails[id].victory,effect,motif}),
    offer:Object.freeze({productId:'skin_'+id.replaceAll('-','_'),priceCents,currency:'EUR',start,end})
  })));
export const getSeasonalSkin = id => SEASONAL_SKINS.find(s=>s.id===id);
// UTC date windows, inclusive. Prices are planning estimates, not Play Store quotes.
export function seasonStatus(offer,now=new Date()) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime())) return {active:false,daysLeft:0};
  const day=now.toISOString().slice(5,10), year=now.getUTCFullYear();
  const {start,end}=offer, wraps=start>end;
  const active=wraps ? day>=start || day<=end : day>=start && day<=end;
  if (!active) return {active:false,daysLeft:0};
  const endYear=wraps && day>=start ? year+1 : year;
  const midnight=Date.UTC(year,now.getUTCMonth(),now.getUTCDate());
  const [month,date]=end.split('-').map(Number);
  return {active,daysLeft:Math.round((Date.UTC(endYear,month-1,date)-midnight)/86400000)+1};
}
export function seasonalCatalog(now=new Date()) {
  return SEASONAL_SKINS.map(skin=>{
    const {active,daysLeft}=seasonStatus(skin.offer,now);
    return {skin,owned:false,active,daysLeft,status:active ? daysLeft+' days left • Preview' : 'Out of season'};
  }).sort((a,b)=>Number(b.active)-Number(a.active));
}
export const seasonalPriceLabel = skin => new Intl.NumberFormat('en-IE',{style:'currency',currency:skin.offer.currency}).format(skin.offer.priceCents/100);

// Every catalog skin has bundled victory art. Only an explicitly authored
// victory effect enables the animated/sound preview; the rest are still art.
export function skinVictoryPreview(skin){
  const animated=Boolean(!skin.prestige&&skin.catalog.victory);
  return {animated,title:animated?'Victory · '+skin.catalog.victory:'Victory artwork · '+skin.name};
}

// Prestige entries are display-only; not part of the local earning or purchase wallet.
const prestigeItems=[
  [
    "obsidian-neon",
    "Obsidian Neon",
    "#141a29",
    "#ff7798",
    "#63eaff",
    "#a9c2ed",
    "#b396ff",
    "#e2eafc",
    "obsidian",
    "Obsidian crystal and iridescent neon"
  ],
  [
    "celestial-void",
    "Celestial Void",
    "#131e39",
    "#f2a6df",
    "#70e1fc",
    "#c1d4fe",
    "#a3b6f9",
    "#e4eaff",
    "platinum",
    "Platinum arches and celestial crystals"
  ],
  [
    "synthwave-sunset",
    "Synthwave Sunset",
    "#321b3d",
    "#ff9d69",
    "#67f1e8",
    "#e8c6f0",
    "#df8fe3",
    "#ffcf9a",
    "metal",
    "Rose chrome and luminous sunset"
  ]
];
export const PRESTIGE_SKINS=Object.freeze(prestigeItems.map(([id,name,bg,x,o,dot,accent,lastMove,material,description])=>Object.freeze({
 id,name,prestige:true,condition:'Prestige • preview only',fill:'full',accent,
 colors:Object.freeze({...CONSTANTS.COLORS,bg,x,o,dot,lastMove,linePlayed:dot,glow:lastMove,lineActive:dot}),
 finish:Object.freeze({material,symbolWeight:.087,glow:4,frame:'bevel',particles:12,effect:'spark',duration:580}),
 catalog:Object.freeze({rarity:'Prestige',description,effect:'Planned'})
})));
export function prestigeCatalog(){return PRESTIGE_SKINS.map(skin=>({skin,owned:false,status:'Preview only'}));}
export const getSkin = id => SKINS.find(s => s.id === id) || getSeasonalSkin(id) || PRESTIGE_SKINS.find(s=>s.id===id) || SKINS[0];
let current = SKINS[0];
export const activeSkin = () => current;
export function setActiveSkin(id) { current = SKINS.find(s=>s.id===id) || SKINS[0]; return current; }
export function unlockedSkin(id, profile, daily) {
  if(PRESTIGE_SKINS.some(s=>s.id===id))return false;
  if (profile && Object.hasOwn(profile,'skinWallet')) return id==='neon'||Boolean(profile.skinWallet?.owned.includes(id));
  switch(id) {
    case 'neon': return true;
    case 'white': return (profile?.unlockedLevel || 1) >= 5;
    case 'ice': return (profile?.unlockedLevel || 1) >= 15;
    case 'wood': return (profile?.stats?.wins || 0) >= 25;
    case 'cyber': return (daily?.completedTotal || 0) >= 7;
    default: return false; // Royal Gold has no purchase or entitlement flow yet.
  }
}
// Derive collection from existing progression; no additional stored grants.
export function skinCatalog(profile,daily,equippedId,collectionOnly=false) {
  return SKINS.map(skin => {
    const owned = unlockedSkin(skin.id,profile,daily);
    return {skin,owned,status:owned ? (skin.id===equippedId ? 'Equipped' : 'Owned') : profile && Object.hasOwn(profile,'skinWallet') ? skinUnlockLabel(skin.id) : skin.id==='royal' ? 'Coming soon' : 'Locked'};
  }).filter(entry => !collectionOnly || entry.owned);
}
export function readSkin(storage,key,profile,daily) {
  if (!key) return 'neon';
  try { const id = storage.getItem(key); return unlockedSkin(id,profile,daily) ? id : 'neon'; }
  catch { return 'neon'; }
}
export function saveSkin(storage,key,id,profile,daily) {
  if (!unlockedSkin(id,profile,daily)) return 'locked';
  if (!key) return 'unavailable';
  try { storage.setItem(key,id); return 'ready'; }
  catch { return 'unavailable'; }
}

// Only presentation changes: never change scoring, save data or winner calculation.
export function resultPresentation(score, mode) {
  const x = score[CONSTANTS.X], o = score[CONSTANTS.O];
  if (x === o) return {outcome:'draw',title:'Draw'};
  if (mode === 'pvp') return {outcome:'victory',title:x > o ? 'Player 1 wins' : 'Player 2 wins'};
  return x > o ? {outcome:'victory',title:'Victory'} : {outcome:'defeat',title:'Game Over'};
}

// Offline test economy, no real-money or competitive advantage.
// One atomic wallet record stores both entitlement and debit.
// V25.4D6C — collectible cosmetics, shared per-player offline wallet.
// All prices are balancing targets; Gems and real-money offers stay inactive.
const characterArt=id=>'/assets/premium/master/avatar-'+id+'-master.webp';
const makeCharacter=(id,label,category,extra={})=>Object.freeze({id,label,category,art:characterArt(id),...extra});
export const CHARACTERS=Object.freeze([
 ...[['spark','Spark'],['fox','Fox'],['robot','Robot'],['rocket','Rocket'],['dragon','Dragon'],['shield','Shield']].map(([id,label])=>makeCharacter(id,label,'starter')),
 makeCharacter('neon-fox','Neon Fox','career',{level:5,legacy:true}),
 ...[['azure-squire','Azure Squire',10],['jade-huntress','Jade Huntress',25],['crimson-sentinel','Crimson Sentinel',40],['frost-oracle','Frost Oracle',60],['onyx-warden','Onyx Warden',80],['crown-ascendant','Crown Ascendant',100]].map(([id,label,level])=>makeCharacter(id,label,'career',{level})),
 ...[['circuit-valkyrie','Circuit Valkyrie',400],['storm-raptor','Storm Raptor',750],['ember-ronin','Ember Ronin',1500]].map(([id,label,price])=>makeCharacter(id,label,'elite',{currency:'coins',price})),
 ...[['moon-weaver','Moon Weaver',100],['coral-corsair','Coral Corsair',200],['prism-golem','Prism Golem',300]].map(([id,label,price])=>makeCharacter(id,label,'elite',{currency:'gems',price})),
 ...[['solar-sovereign','Solar Sovereign'],['void-monarch','Void Monarch'],['celestial-empress','Celestial Empress'],['dragon-emperor','Dragon Emperor'],['aurora-seraph','Aurora Seraph'],['chronos-architect','Chronos Architect']].map(([id,label])=>makeCharacter(id,label,'legendary',{currency:'eur'}))
]);
export function getCharacter(id){return CHARACTERS.find(c=>c.id===id)||null;}
export function characterEntitlement(id,profile,wallet){
 const c=getCharacter(id);
 if(!c)return 'unknown';
 if(c.category==='starter')return 'owned';
 if(c.category==='career'){
  return (c.legacy&&profile?.neonFoxUnlocked)||profile?.stars?.[c.level]>0||wallet?.stars?.[c.level]>0?'owned':'locked';
 }
 if(c.currency==='coins')return wallet?.characters?.includes(id)?'owned':'coins';
 return 'preview';
}
export function characterCatalog(profile,wallet,equipped){
 return CHARACTERS.map(character=>{const entitlement=characterEntitlement(character.id,profile,wallet);return {character,entitlement,equipped:entitlement==='owned'&&character.id===equipped};});
}

export const WALLET_KEY='rombmaster_wallet_v1';
export const SKIN_REWARDS=Object.freeze({royal:30,wood:60,white:90});
export const SKIN_PRICES=Object.freeze({cyber:600,ice:900});
export function skinUnlockLabel(id){return SKIN_REWARDS[id]?'Win Career level '+SKIN_REWARDS[id]:SKIN_PRICES[id]?SKIN_PRICES[id]+' Coins':'Included';}
const coreIds=SKINS.map(s=>s.id).filter(id=>id!=='neon');
function earnedCoins(w){return Object.values(w.stars).reduce((n,s)=>n+60+s*20,0)+w.daily*100;}
export function walletBalance(w){return w?earnedCoins(w)-w.spent:0;}
function validWallet(w){
 return w?.version===1&&w.stars&&typeof w.stars==='object'&&!Array.isArray(w.stars)&&Object.entries(w.stars).every(([k,v])=>/^(?:[1-9]|[1-9][0-9]|100)$/.test(k)&&Number.isInteger(v)&&v>=1&&v<=3)
 &&Number.isSafeInteger(w.daily)&&w.daily>=0&&w.daily<=1000000&&Number.isSafeInteger(w.spent)&&w.spent>=0&&Array.isArray(w.owned)&&w.owned.every(id=>coreIds.includes(id))&&new Set(w.owned).size===w.owned.length&&walletBalance(w)>=0
 &&(w.characters===undefined||(Array.isArray(w.characters)&&w.characters.every(id=>getCharacter(id)?.currency==='coins')&&new Set(w.characters).size===w.characters.length));
}
export function syncWallet(storage,key,profile,daily){
 if(!key||!profile||!daily)return {status:'unavailable',wallet:null};
 try{
  const raw=storage.getItem(key);
  if(raw!==null&&(typeof raw!=='string'||raw.length>20000))return {status:'invalid',wallet:null};
  const w=raw===null?{version:1,stars:{},daily:0,spent:0,owned:coreIds.filter(id=>unlockedSkin(id,profile,daily))}:JSON.parse(raw);
  if(!validWallet(w))return {status:'invalid',wallet:null};
  for(const [level,stars] of Object.entries(profile.stars||{}))w.stars[level]=Math.max(w.stars[level]||0,stars);
  w.daily=Math.max(w.daily,daily.completedTotal||0);
  for(const [id,level] of Object.entries(SKIN_REWARDS))if(w.stars[level]&&!w.owned.includes(id))w.owned.push(id);
  if(!validWallet(w))return {status:'invalid',wallet:null};
  const serialized=JSON.stringify(w);
  if(serialized!==raw)storage.setItem(key,serialized);
  return {status:'ready',wallet:w};
 }catch{return {status:'unavailable',wallet:null};}
}
export function buyWalletSkin(storage,key,id,profile,daily){
 const price=SKIN_PRICES[id];if(!price)return {status:'not-for-sale'};
 const state=syncWallet(storage,key,profile,daily);if(state.status!=='ready')return state;
 const w=state.wallet;
 if(w.owned.includes(id))return {status:'owned',wallet:w};
 if(walletBalance(w)<price)return {status:'insufficient',wallet:w};
 const next={...w,owned:[...w.owned,id],spent:w.spent+price};
 try{storage.setItem(key,JSON.stringify(next));return {status:'ready',wallet:next};}
 catch{return {status:'unavailable'};}
}

 
// Persist purchase and ownership together in the SAME slot wallet as skins.
export function buyWalletCharacter(storage,key,id,profile,daily){
 const c=getCharacter(id);
 if(c?.currency!=='coins')return {status:'not-for-sale'};
 const state=syncWallet(storage,key,profile,daily);if(state.status!=='ready')return state;
 const w=state.wallet;
 if(w.characters?.includes(id))return {status:'owned',wallet:w};
 if(walletBalance(w)<c.price)return {status:'insufficient',wallet:w};
 const next={...w,characters:[...(w.characters||[]),id],spent:w.spent+c.price};
 if(!validWallet(next))return {status:'invalid',wallet:null};
 try{storage.setItem(key,JSON.stringify(next));return {status:'ready',wallet:next};}
 catch{return {status:'unavailable',wallet:null};}
}
