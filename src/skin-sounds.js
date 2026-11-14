// Original short synthesized UI cues: [frequency Hz, waveform, seconds, gain, delay ms].
// No downloads or background music. Gains are deliberately low for phone speakers.
const themes = {
  neon: {move:[[300,'sine',.09,.045,0]],capture:[[600,'triangle',.11,.065,0],[800,'sine',.18,.065,85]],win:[[400,'triangle',.12,.06,0],[500,'triangle',.12,.06,100],[600,'triangle',.15,.06,200],[800,'sine',.22,.07,300]]},
  royal: {move:[[523,'sine',.12,.04,0]],capture:[[659,'sine',.18,.065,0],[988,'sine',.16,.04,35],[1318,'sine',.23,.035,95]],win:[[523,'triangle',.18,.055,0],[659,'sine',.18,.06,100],[784,'sine',.22,.06,200],[1047,'sine',.30,.065,300]]},
  cyber: {move:[[230,'square',.055,.025,0],[460,'triangle',.055,.025,35]],capture:[[330,'sawtooth',.09,.028,0],[660,'square',.08,.025,65],[990,'triangle',.13,.055,120]],win:[[220,'triangle',.1,.05,0],[440,'square',.09,.025,90],[880,'triangle',.15,.055,180],[1320,'sine',.20,.05,265]]},
  ice: {move:[[440,'triangle',.085,.045,0]],capture:[[260,'triangle',.14,.055,0],[1046,'sine',.20,.045,70],[1568,'sine',.23,.028,130]],win:[[392,'triangle',.18,.055,0],[784,'sine',.20,.045,90],[1175,'sine',.22,.04,180],[1568,'sine',.28,.035,270]]},
  wood: {move:[[170,'triangle',.045,.065,0]],capture:[[205,'triangle',.065,.075,0],[310,'triangle',.09,.06,60]],win:[[196,'triangle',.09,.07,0],[247,'triangle',.09,.065,100],[294,'triangle',.11,.065,200],[392,'sine',.19,.06,300]]},
  white: {move:[[420,'sine',.045,.032,0]],capture:[[660,'sine',.09,.045,0],[880,'sine',.12,.04,70]],win:[[523,'sine',.10,.04,0],[659,'sine',.10,.04,100],[784,'sine',.16,.045,200]]},
};
export const soundCue = (id, event) => (themes[id] || themes.neon)[event] || [];
