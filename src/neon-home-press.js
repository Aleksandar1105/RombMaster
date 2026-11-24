/*
 * Neon Polish P1.6: visual feedback only. Existing document click listener
 * already handles the user's sound/haptics preferences; do NOT duplicate it.
 */
const HOME_BUTTON = '#home-hub[data-home-revision="3"][data-layout="premium"][data-neon-reference="1"] :is(.play-row,.mode-grid) > button';
const PRESSED = 'rm-home-press';

export function clearNeonHomePress(doc) {
  for (const button of doc.querySelectorAll('#home-hub button.rm-home-press')) {
    button.classList.remove(PRESSED);
  }
}

export function mountNeonHomePress(doc) {
  const qualifies = event => {
    const root = doc.documentElement?.dataset;
    if (root?.edition !== 'core' || root?.skin !== 'neon') return null;
    if (doc.getElementById('home-hub')?.hidden) return null;
    const button = event.target?.closest?.(HOME_BUTTON);
    if (!button || button.disabled || button.hidden ||
        button.getAttribute?.('aria-disabled') === 'true') return null;
    return button;
  };

  const play = (event, allowRestart = true) => {
    const button = qualifies(event);
    if (!button) return;
    if (doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return;
    // Synthetic assistive click following an existing key press must not
    // restart the same animation. Real repeated taps can restart it.
    if (!allowRestart && button.classList.contains(PRESSED)) return;
    button.classList.remove(PRESSED);
    void button.offsetWidth; // Restart only this small CSS animation.
    button.classList.add(PRESSED);
  };

  doc.addEventListener('pointerdown', event => {
    if (event.isPrimary === false || (event.button != null && event.button !== 0)) return;
    play(event);
  }, true);

  doc.addEventListener('keydown', event => {
    if (event.repeat || (event.key !== 'Enter' && event.key !== ' ')) return;
    play(event, false);
  }, true);

  doc.addEventListener('click', event => {
    // detail === 0 is keyboard/screen-reader activation, not a physical click.
    if (event.detail === 0) play(event, false);
  }, true);

  const release = event => {
    if (event.animationName === 'rm-home-press-depth')
      event.target?.classList?.remove(PRESSED);
  };
  doc.addEventListener('animationend', release, true);
  doc.addEventListener('animationcancel', release, true);
}