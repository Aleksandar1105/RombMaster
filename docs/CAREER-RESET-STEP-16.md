# Step 16 — safe local Career reset (Draft)

## What this changes
- Adds **Reset Career Progress** to the offline local profile.
- Uses a custom dark/glass confirmation dialog, not a native Android confirm.
- Resets Career XP, unlocks (to level 1), stars, win/loss statistics, streaks and achievements derived from those statistics.
- Preserves nickname and avatar, Quick/PvP saves and independent Daily Brain Challenge progress.
- Keeps existing profile storage version/key. Invalid or unavailable profile storage is not silently overwritten.
- Refuses to reset while an unfinished/finished Career save, invalid save or unavailable save storage exists; resolve the saved game first. It rechecks just before confirmation.
- Android Back cancels the modal.

## QA and release gates
This draft is stacked on `fix/step-15-input-scale-stability` (PR #16). PR #15 is a sibling fix; do not blindly merge both. The cross-realm test correction is already in PR #16. The branch is **not** merged into main.

Added unit and integration tests for reset, data preservation, active Career saves and Android Back. Tests and Android build have **not been executed** in this GitHub connector session. No generated dist update was made; a local `npm run build` must regenerate it. Do not merge or install until the complete suite and build pass.

### Required local verification
1. Run `npm ci`, `npm test`, `npm run build` on a disposable checkout of this branch.
2. Run `npx --no-install cap sync android` and build the debug APK locally in Android Studio (JDK 17). Verify `com.rombmaster.game.test` for the debug application ID.
3. Test a real Android device: cancel/confirm modal, Back, Level 1 restart, stats and achievements, name/avatar preservation, saved Career blocker, Daily persistence, Quick/PvP Continue, UI on small screens.
4. Restore a known backup and verify no accidental data loss. Do not test destructive reset on the only copy of valuable progress.

### Future separate work
Multiple player profiles/save slots and replacing the remaining `window.confirm` dialogs should be separate PRs with migration and accessibility tests. Do not introduce accounts, online sync, analytics, monetization, Actions or Play Store publishing as part of this change.
