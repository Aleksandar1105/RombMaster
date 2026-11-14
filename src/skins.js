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
  neon: Object.freeze({material:'inset', symbolWeight:.105, glow:0, frame:'round', particles:15, effect:'ring', duration:360}),
  royal: Object.freeze({material:'metal', symbolWeight:.086, glow:4, frame:'bevel', particles:18, effect:'spark', duration:580}),
  cyber: Object.freeze({material:'circuit', symbolWeight:.079, glow:8, frame:'angular', particles:20, effect:'scan', duration:380}),
  ice: Object.freeze({material:'crystal', symbolWeight:.085, glow:5, frame:'bevel', particles:16, effect:'shard', duration:480}),
  wood: Object.freeze({material:'grain', symbolWeight:.095, glow:0, frame:'round', particles:10, effect:'dust', duration:340}),
  white: Object.freeze({material:'matte', symbolWeight:.085, glow:0, frame:'round', particles:8, effect:'ripple', duration:280}),
});
// Rarity is presentation metadata, never a purchase entitlement.
const catalog = Object.freeze({
  neon: Object.freeze({ rarity:'Included', description:'The original neon arena', effect:'Neon ring' }),
  royal: Object.freeze({ rarity:'Legendary', description:'Gilded metal and royal elegance', effect:'Golden sparks' }),
  cyber: Object.freeze({ rarity:'Epic', description:'Angular digital circuitry', effect:'Scan wave' }),
  ice: Object.freeze({ rarity:'Legendary', description:'Embers meet crystalline ice', effect:'Crystal shards' }),
  wood: Object.freeze({ rarity:'Rare', description:'Handcrafted natural wood', effect:'Wood dust' }),
  white: Object.freeze({ rarity:'Rare', description:'Clean matte minimalism', effect:'Gentle ripple' }),
});
export const SKINS = Object.freeze(items.map(([id,name,condition,bg,x,o,dot,accent,lastMove,linePlayed,fill]) =>
  Object.freeze({id,name,condition,fill,accent, catalog:catalog[id], finish:finishes[id], colors:Object.freeze({...CONSTANTS.COLORS,bg,x,o,dot,lastMove,linePlayed,glow:lastMove,lineActive:dot})})));
export const getSkin = id => SKINS.find(s => s.id === id) || SKINS[0];
let current = SKINS[0];
export const activeSkin = () => current;
export function setActiveSkin(id) { current = getSkin(id); return current; }
export function unlockedSkin(id, profile, daily) {
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
    return {skin,owned,status:owned ? (skin.id===equippedId ? 'Equipped' : 'Owned') : skin.id==='royal' ? 'Coming soon' : 'Locked'};
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
