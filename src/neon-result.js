// Presentation only: consume the completed match, never write progression or wallet state.
export function renderCoreResult(overlay, game, doc) {
  const el = id => doc.getElementById(id);
  const outcome = overlay.dataset.outcome;
  const level = game.settings.careerLevel;
  const ready = game.careerOutcome?.status === 'ready';
  const victory = outcome === 'victory';
  const title = el('result-title');
  if (outcome === 'defeat') title.textContent = 'Defeat';
  if (victory) {
    const caption = doc.createElement('span'); caption.className = 'rm-victory-caption';
    caption.textContent = title.textContent;
    title.replaceChildren(caption);
  }
  if (outcome === 'defeat' || outcome === 'draw') {
    const hero = doc.createElement('span'); hero.className = 'rm-outcome-emblem';
    hero.setAttribute('aria-hidden','true');
    for (const side of ['left','right']) {
      const part=doc.createElement('span'); part.className='rm-emblem-part rm-emblem-'+side;hero.append(part);
    }
    const caption=doc.createElement('span');caption.className='rm-outcome-caption';caption.textContent=outcome === 'draw' ? 'Draw' : 'Defeat';
    title.replaceChildren(hero,caption);
    const replay=el('againBtn');
    if (replay && outcome === 'draw' && !level) replay.textContent='Rematch';
  }
  const context = el('rm-result-context') || doc.createElement('p');
  context.id = 'rm-result-context';
  context.textContent = level ? 'Career · Level ' + level : game.settings.mode === 'pvp' ? 'Local match' : 'Quick Play';
  title.before(context);
  const score = el('result-score');
  const values = score.textContent.match(/^\s*(\d+)\s*-\s*(\d+)\s*$/);
  if (values) {
    score.setAttribute('aria-label', 'Final score: ' + values[1] + ' to ' + values[2]);
    const side = (label, value, cls) => {
      const item = doc.createElement('span'); item.className = 'rm-final-side ' + cls;
      const name = doc.createElement('small'); name.textContent = label;
      const number = doc.createElement('strong'); number.textContent = value;
      item.append(name, number); return item;
    };
    const vs = doc.createElement('span'); vs.className = 'rm-final-vs'; vs.textContent = 'VS';
    score.replaceChildren(side(el('p1-name').textContent, values[1], 'rm-final-x'), vs,
      side(el('p2-name').textContent, values[2], 'rm-final-o'));
  }
  const stars = el('result-stars');
  const earned = victory && level && ready ? Math.max(0, Math.min(3, game.careerOutcome.awardedStars || 0)) : 0;
  stars.hidden = !earned;
  stars.replaceChildren();
  if (earned) {
    stars.removeAttribute('aria-hidden'); stars.setAttribute('aria-label', earned + ' of 3 stars earned');
    for (let i = 0; i < 3; i++) {
      const star = doc.createElement('span'); star.className = 'rm-final-star';
      star.dataset.earned = String(i < earned); star.style.setProperty('--star-delay', (550 + i * 200) + 'ms');
      star.setAttribute('aria-hidden', 'true');
      if (i < earned) {
        let played = false;
        star.addEventListener('animationend', event => {
          // Pseudo-element bursts have their own animation events. Only the
          // actual star arrival can sound, once, while this result is current.
          if (played || event.target !== star || event.pseudoElement || event.animationName !== 'rm-p47c-star') return;
          if (!star.isConnected || !stars.contains(star) || !overlay.classList.contains('flex') || overlay.dataset.outcome !== 'victory') return;
          played = true;
          game.resultStarCue?.(i);
        });
      }
      stars.append(star);
    }
  }
  const note = el('rm-result-note') || doc.createElement('p');
  note.id = 'rm-result-note';
  // The score, real rewards and next-level CTA already communicate the outcome.
  note.textContent = '';
  note.hidden = true;
  overlay.querySelector('.rm-result-overview').append(note);
  // Keep computed statistics in Game.endGame and its data attributes.
  const analysis = el('match-analysis');
  if (analysis) analysis.hidden = true;
}
