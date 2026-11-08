# Saved games

The single local slot is `localStorage.rhombus_save`. This is local to the app
installation/browser profile, not cloud sync or a backup across reinstallations.

Version 1 stores `{ version: 1, settings: { size, mode, diff }, moves: [{ t, r, c }] }`.
It is written on new game, each accepted move, Undo and return to the menu.
Scores, ownership, turn, last move and Undo snapshots are reconstructed by
replaying legal moves from the standard initial board. Saved JSON is never used
as a Board instance. Settings and move count are bounded; malformed, repeated,
out-of-board or unavailable moves are rejected. The serialized input limit is
2,000,000 characters to allow the older full-snapshot format.

Unversioned legacy saves migrate only when each snapshot, score and player turn
matches replayed legal transitions, including the final board. Unknown versions
and corrupt data are preserved until a confirmed new game replaces the slot.

Continue appears only for a validated unfinished game. Resuming an AI turn queues
one response and cancels the previous game's timers and animation frame first.
Restart and rematch use the resumed settings. New-game replacement and restart
after a move ask for confirmation. Completed logs are not resumable, even if
storage cleanup fails after the final move was successfully saved.

Storage failures do not block gameplay. The UI warns that progress was not saved;
if writes fail, the existing slot may contain an earlier position. If access is
blocked, restore is unavailable. There is no guarantee of persistence if storage
is denied, cleared, full, or the app is uninstalled.

Automated checks exercise simulated reloads, migration, malformed data, storage
exceptions, Undo, AI scheduling and menu actions. Real WebView persistence,
process termination, screen layout and native confirmation dialogs still need
physical Android verification before release.
