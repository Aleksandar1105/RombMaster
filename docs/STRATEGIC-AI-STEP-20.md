# Step 20 — bounded strategic AI
- A hard opponent now tries exact small-endgame calculation when nine or fewer free edges remain and search depth is at least two.
- An exact result is accepted only if the node budget completes; otherwise the existing bounded alpha-beta fallback stays in control.
- When safe moves are exhausted, AI approximates the opponent's forced capture run and opens the least costly chain.
- Career AI level progression and immediate capture priority outside the small-endgame state remain unchanged.
- All decisions are made from cloned boards; no saved-game format or turn mechanics change.

## QA gates
1. `npm test` and `npm run build` locally.
2. On a physical phone test Master and Career levels 24–30 on 8×8 for lag, legal moves and battery.
3. Verify double captures, extra AI turns, Undo after AI, saved game resume and background lock/unlock.
4. Any visible freeze or illegal move = FAIL. Do not merge while unresolved.
