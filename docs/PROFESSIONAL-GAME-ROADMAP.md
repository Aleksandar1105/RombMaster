# RombMaster — professional game roadmap

## Step 19: Visual identity and home navigation (this PR)
- Midnight / cyan / coral / gold brand language and scalable diamond mark.
- First-screen hierarchy: Continue when saved, Quick Play, Career, Daily Brain Challenge; Quick Play parameters and guest-first local profile in native expandable details.
- Preserve existing element IDs, local save profile format, game rules, daily reset and Undo.
- No ads, tracking, cloud sync, payments or workflow runs.

## Step 20: Strategic AI, only after Step 19 verification
- Establish deterministic benchmarks for capture sequences, multi-turn chains, safe moves, chain sacrifices, and parity of player roles.
- Compare against existing AI across 4/6/8 board sizes, measure legal moves, win rate and response time on low-end Android.
- Add bounded endgame search and chain-awareness where statistically better; protect the UI thread and play fairness.
- Adjust Career level difficulty progressively rather than merely increasing raw search depth.

## Step 21: Game feel and first-play experience
- A short guided first win, easy-to-understand move preview, subtle haptics/particles, clear end-match results.
- Sound and haptics preferences; accessibility and reduced motion.
- Proper Android adaptive app icon, carefully exported from approved brand art with insets, screenshots and listing.

## Step 22: Retention and monetization readiness
- Pilot 20–30 first-time players; instrument consent-aware aggregated tutorial completion, match completion, D1/D7 retention when appropriate.
- No ad/payment SDKs until stability, audience and policy review.
- Consider optional rewarded ads and a one-time ad-free purchase; no pay-to-win or disruptive ads.
- International language support and store listing localization.

## Release stop conditions
No merge until earlier stacked Draft PRs are validated and integrated in dependency order. Run `npm ci`, `npm test`, `npm run build`, Capacitor sync, Android Gradle debug build and real-device tests. Record actual PASS/FAIL; source reviews are not execution tests. Confirm no losses of saved match, profile, Daily rewards or Undo state.
