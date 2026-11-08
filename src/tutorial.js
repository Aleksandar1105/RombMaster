export const TUTORIAL_STEPS = Object.freeze([
  {
    title: 'Start with a 2–2 score',
    text: 'Four starter squares are already owned: two red and two blue. They are part of the board, not bonus points.',
    diagram: 'start',
  },
  {
    title: 'Connect two dots',
    text: 'Tap the middle of an available dotted line to claim it. A line can only be drawn once.',
    diagram: 'line',
  },
  {
    title: 'Complete a square',
    text: 'The player who closes the fourth side captures that square and earns one point.',
    diagram: 'capture',
  },
  {
    title: 'Capture again or pass the turn',
    text: 'Capturing a square gives you another turn. Otherwise the other player moves. The most squares wins.',
    diagram: 'again',
  },
]);

export function tutorialStep(index) {
  if (!Number.isInteger(index) || index < 0 || index >= TUTORIAL_STEPS.length) {
    throw new Error('Invalid tutorial step');
  }
  return TUTORIAL_STEPS[index];
}
