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
  neon: Object.freeze({material:'inset', symbolWeight:.105, glow:0, frame:'round', particles:15}),
  royal: Object.freeze({material:'metal', symbolWeight:.086, glow:4, frame:'bevel', particles:18}),
  cyber: Object.freeze({material:'circuit', symbolWeight:.079, glow:8, frame:'angular', particles:20}),
  ice: Object.freeze({material:'crystal', symbolWeight:.085, glow:5, frame:'bevel', particles:16}),
  wood: Object.freeze({material:'grain', symbolWeight:.095, glow:0, frame:'round', particles:10}),
  white: Object.freeze({material:'matte', symbolWeight:.085, glow:0, frame:'round', particles:8}),
});
export const SKINS = Object.freeze(items.map(([id,name,condition,bg,x,o,dot,accent,lastMove,linePlayed,fill]) =>
  Object.freeze({id,name,condition,fill,accent, finish:finishes[id], colors:Object.freeze({...CONSTANTS.COLORS,bg,x,o,dot,lastMove,linePlayed,glow:lastMove,lineActive:dot})})));
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
