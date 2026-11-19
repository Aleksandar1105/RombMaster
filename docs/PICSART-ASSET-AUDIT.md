# Picsart / GitHub asset reconciliation — 2026-11-19

Baseline: 48a9dce (feat/v25-royal-master). Runtime changes through 6acddb7.
Drive listing: 127 entries (126 images, 1 video); 120 distinct source URLs.
This is a name/reference/provenance audit, not pixel-by-pixel visual acceptance.

## Repository inventory

| Group | Tracked files in comparison | Literal runtime references |
|---|---:|---:|
| Master | 104 | 88 |
| Reference | 40 | 37 |
| Career arenas | 6 | 6 |
| Career rivals (legacy) | 6 | 6 |
| Total | 156 | 137 |

All 137 literal premium asset references extracted from style.css, skin-store-compact.css, main.js, index.html and skins.js appear in the branch comparison against main. 16 original button images are retained as source variants of the clean button assets. Three reference entries (manifest and two source PNGs) are not direct runtime references. No removal or replacement performed. Dynamic paths are separately checked by the validator.

## Known imported batches: source matches in Drive

Only counts and repository filenames are recorded here; do not publish private Drive URLs or identifiers.
Some entries share a display name and some are duplicate URLs.

| Target | Batch commit | Matching Drive entries |
|---|---|---:|
| neon-master-arena.webp | a19da4a | 1 |
| neon-master-store.webp | a19da4a | 1 |
| royal-master-arena.webp | 11433fc | 1 |
| royal-master-store.webp | 11433fc | 1 |
| royal-master-hero.webp | 11433fc | 1 |
| arena-puzzle.webp | 5ebc496 | 1 |
| arena-perfect.webp | 5ebc496 | 1 |
| arena-blitz.webp | 5ebc496 | 1 |
| arena-survival.webp | 5ebc496 | 1 |
| arena-infinity.webp | 5ebc496 | 1 |
| neon-master-victory.webp | 2fb017b | 1 |
| royal-master-victory.webp | 2fb017b | 1 |
| cyber-master-victory.webp | 2fb017b | 1 |
| ice-master-victory.webp | 2fb017b | 1 |
| wood-master-victory.webp | 2fb017b | 1 |
| white-master-victory.webp | 2fb017b | 1 |
| frozen-christmas-master-victory.webp | 2fb017b | 1 |
| golden-dragon-master-victory.webp | 2fb017b | 1 |
| spring-blossom-master-victory.webp | 2fb017b | 1 |
| summer-paradise-master-victory.webp | 2fb017b | 1 |
| autumn-kingdom-master-victory.webp | 2fb017b | 1 |
| halloween-curse-master-victory.webp | 2fb017b | 1 |
| midnight-gold-master-victory.webp | 2fb017b | 1 |
| obsidian-neon-master-victory.webp | 2fb017b | 1 |
| celestial-void-master-victory.webp | 2fb017b | 1 |
| synthwave-sunset-master-victory.webp | 2fb017b | 1 |
| avatar-azure-squire-master.webp | f0c90c4 | 1 |
| avatar-jade-huntress-master.webp | f0c90c4 | 1 |
| avatar-crimson-sentinel-master.webp | f0c90c4 | 1 |
| avatar-frost-oracle-master.webp | f0c90c4 | 1 |
| avatar-onyx-warden-master.webp | f0c90c4 | 1 |
| avatar-crown-ascendant-master.webp | f0c90c4 | 1 |
| avatar-circuit-valkyrie-master.webp | f0c90c4 | 1 |
| avatar-storm-raptor-master.webp | f0c90c4 | 1 |
| avatar-ember-ronin-master.webp | f0c90c4 | 1 |
| avatar-moon-weaver-master.webp | f0c90c4 | 1 |
| avatar-coral-corsair-master.webp | f0c90c4 | 1 |
| avatar-prism-golem-master.webp | f0c90c4 | 1 |
| avatar-solar-sovereign-master.webp | f0c90c4 | 1 |
| avatar-void-monarch-master.webp | f0c90c4 | 1 |
| avatar-celestial-empress-master.webp | f0c90c4 | 1 |
| avatar-dragon-emperor-master.webp | f0c90c4 | 1 |
| avatar-aurora-seraph-master.webp | f0c90c4 | 1 |
| avatar-chronos-architect-master.webp | f0c90c4 | 1 |
| rival-rookie-master.webp | cf9cb5d | 2 |
| rival-trickster-master.webp | cf9cb5d | 2 |
| rival-predator-master.webp | cf9cb5d | 2 |
| rival-phantom-master.webp | cf9cb5d | 2 |
| rival-grandmaster-master.webp | cf9cb5d | 2 |
| rival-omega-master.webp | cf9cb5d | 2 |

## Runtime omission corrected

- Make all 16 existing victory images accessible in Skin Store. Existing authored animated/sound previews remain unchanged; other previews display static art without audio or ownership changes.
- Prestige remains preview-only (no Home preview, equipping or purchases); do not introduce speculative Home variants.
- Asset validator now includes 6 Career chapter and 6 legacy rival assets plus checks dynamic store hero coverage.
- New regression test checks policy for all 16 themes.

## Remaining gates

- Full regression suite, local and packaged asset validator, signed cloud APK and physical device QA not executed in this audit.
- Not all Drive entries have a unique identifiable source-to-target mapping from recovered manifests. Do not import older concepts, source crops, unapproved variants or unrelated personal media simply because they are in Drive. No visual equivalence claim for same-name files.
- Final Home artwork approval, unique capture/victory animations and audio remain open. No audio assets were found in this Drive listing.
- No new Picsart generation, credits, GitHub Actions or real payments.
