# Step 17 — Multiple local players (Draft)

## Scope
- Up to **four profiles on one installation**: the existing Guest plus three more local players.
- Switch player in the menu, or create a player with a unique 1–18-character nickname.
- Each slot has its own Career XP, stars, unlocked levels, streaks, derived achievements, unfinished game with Continue/Undo, and Daily Brain Challenge progress and Brain Points.
- Guest retains the original storage keys and data, with no destructive migration:
  - `rombmaster_profile_v1`
  - `rhombus_save`
  - `rombmaster_daily_progress_v1`
- Additional profiles use these same keys suffixed by `:slot-N`. An index at `rombmaster_player_slots_v1` stores version, slots and active player.
- Create and switch are offline, with no account, backend, cloud, purchases, or advertising SDK.
- Existing name/avatar controls and Reset Career act on the **active player only**.

## Data-safety design
- Missing player index means legacy Guest (no forced overwrite); malformed/unsupported index blocks writes.
- Existing non-Guest slots missing profile data are treated as invalid, not silently initialized.
- Slot names are normalized and kept as escaped text in the selector.
- New slot IDs never reuse orphan keys from interrupted creations.
- While changing player, stop game timers, clear the previous in-memory board, reload scoped Continue and Career/Daily UI.
- Android backgrounding while in menu does not write stale game state under another player.
- Do not delete any player slots in this step. Backups/recovery and slot removal should be designed separately.

## Verification to run in a disposable Windows clone
1. `npm ci` and `npm test`; investigate every failure.
2. `npm run build` to regenerate tracked `dist`; review the resulting output before any merge.
3. `npx --no-install cap sync android` and local Gradle debug APK build, without GitHub Actions.
4. On a physical Android device, test Guest migration, adding 3 slots, refusing a fifth/duplicate, profile switching, Career reset, Continue and Undo per player, Daily points per player, app switch/lock, Android Back, and restart after process termination.
5. Validate old guest data and save preservation before testing on meaningful player progress.

## Dependencies and release conditions
Draft PR is stacked on PR #18 (safe Career reset), itself based on PR #16 (Android touch mapping). `main` remains untouched. Do not merge or publish until the full test suite, web build, Android debug build and device acceptance pass.

**Not executed in the GitHub connector environment:** npm, browser tests, Capacitor sync, Android Gradle compile, physical-device tests. No release APK, signed AAB, or Play Store publication is claimed.
