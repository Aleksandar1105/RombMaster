# Step 18 — In-game confirmation dialogs (Draft)

## User-visible changes
- Replaces all three browser-native `window.confirm` dialogs in `src/main.js` with one reusable dark/glass modal:
  - Starting a Quick/PvP game when the active player's save already exists.
  - Starting Career when an existing saved match would be replaced.
  - Restarting an unfinished match after moves have been made.
- Clear accept/cancel actions, no native Android popup, responsive layout and accessible alertdialog labels.
- Cancel, Escape and Android Back dismiss the confirmation with no save replacement.
- While a confirmation is open, the game pauses via the existing lifecycle guard, preventing AI moves and stray taps; on dismiss the app resumes.
- The controller assigns all content with `textContent`, keeps focus on action controls and restores it afterward; duplicate confirmation/accept events do not repeat the action.
- The current local player ID is rechecked before executing a new game/restart. Saves of other player slots must remain unchanged.
- Inaccessible save storage blocks replacement rather than implying safe data loss.

## Scope boundaries
- The existing **Reset Career Progress** custom dialog (Step 16) remains unchanged.
- No new account system, login, cloud features, ads, billing, native plugin dependencies, or GitHub Actions.
- Existing finished-result overlay, tutorial and Daily Brain Challenge are not redesigned here.
- `main` is unchanged. Draft stacked on Step 17 PR #19.

## Tests added/updated (not executed in GitHub connector session)
- `tests/confirmation.test.cjs`: cancellation/Escape, double-submit guard, safe text, focus loop.
- `tests/input.test.cjs`: new-game cancel/back/confirm, Career cancel, restart pause/back/confirm, resume and save preservation.

## Required release gates
1. In disposable local clone, `npm ci`, `npm test`, `npm run build`.
2. `npx --no-install cap sync android`, debug APK compile locally in Android Studio. No GitHub Actions.
3. Real Android device: new game/Continue from each local player, restart during AI and PvP, Back, cancel, touch outside modal, screen rotation/background, keyboard accessibility, compact viewport, confirm exactly once.
4. Verify old Guest data, all local slots and Daily Brain Points before proceeding to merge.
5. Regenerate dist from local build; the tracked `dist` has not been updated here.
6. Stop on any FAIL; do not merge PRs or publish until all required checks pass.
