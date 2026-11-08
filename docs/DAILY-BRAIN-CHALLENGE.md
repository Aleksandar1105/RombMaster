# Step 13 — Daily Brain Challenge (offline prototype)

Goal: make RombMaster fun to return to through short, meaningful practice,
not an endless timer, notification spam, or monetized pressure.

## Gameplay

- The main menu includes an optional **Train Your Brain** button.
- A dedicated puzzle board avoids disturbing Quick Play, PvP, Career Mode,
  saved Undo history or profile statistics.
- Each device-local calendar day offers **three deterministic tactics**:
  1. Find a scoring line (capture);
  2. Pick a safe move, avoiding an easy reply for the opponent;
  3. Capture two adjoining squares with one line.
- Wrong selections offer specific tactical advice and do **not** consume the
  attempt. No lives, paid retries, streak punishment or countdown.
- A complete workout grants **30 local Brain Points** only once for that day.
  These are separate from Career XP; they do not purchase items or determine
  ranking. Partial completion (0, 1, 2 solved) is restored when reopening.
- Local completion streaks exist only as optional stats, without push
  notifications or punitive rewards.
- Device date/time controls the puzzle sequence. Date changes and local
  storage tampering mean points cannot serve as verified online scores.

## Implementation boundaries

- `daily-challenge.js` deterministically generates a playable Board and
  validates candidate moves from actual captured-square outcomes and
  immediate counterplay.
- `daily-progress.js` maintains one isolated version-1 storage key,
  `rombmaster_daily_progress_v1`. Older/invalid data is never overwritten.
- Puzzles are displayed with the existing Renderer on a *separate canvas*.
  Touch selection shares the bounded legal-line selection helper.
- The daily dialog has its own Back handler and cannot make moves on a
  suspended real match. No network, cloud account, ads or permissions.
- Puzzle generation was additionally exercised in a standalone V8 check
  for **3,024 puzzle instances** across 2026–2028 with zero generation or
  unsolvable-position errors. This is not a browser, npm or Android test.

## Release acceptance

- Run `npm test`, `npm run build`, and the local Android debug APK build.
- Check each challenge on small and large phones, portrait and landscape.
- Confirm one successful completion updates daily progress once, remains
  complete after app reopening, and rolls to tomorrow's tasks correctly.
- Confirm an active PvP/Career save and Undo count are unchanged after
  opening, closing, retrying, or completing Daily Brain Challenge.
- Verify native Back, touch near dots, result feedback, and small-screen
  scrolling without content overlap.
- Verify clear messaging if local storage is disabled or corrupted, and no
  misleading cognitive health claims in product descriptions.
