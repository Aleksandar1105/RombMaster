# RombMaster — current roadmap checkpoint

Long-term milestones are in ROADMAP.md.

## Continuing development

For every project change, update ROADMAP-CURRENT.md (milestone and next step), DEVELOPMENT_STATUS.md (implementation and revision) and QA_STATUS.md (checks run, results and pending checks) in the same commit. When starting a new conversation, read all three at the current branch head.

## Neon HUD and controls · 2026-11-21

Neon Home HUD and action icons are ready for the next Android visual review. The owner screenshot shows the repaired play row. Review the compact currency display, action bevels and centered help label. Gems remain reserved for a future economy milestone.

## Previous Android review · 2026-11-21

Runtime revision `80ea07d`. Screenshot 34510.jpg from the owner prompted a Neon Home correction to the play row, transparent logo lighting, help button and rival availability. Next gate: check this revision on Android with a saved match and on a fresh profile.

### Implementation and verification

The two play buttons use an explicit horizontal flex row with automatic widths. With no saved match, Quick Play fills the row. The transparent logo is 8% larger in portrait and has contour lighting. Help has a smaller hexagonal button, and locked portraits are dimmed. Rival status is visually hidden but available to screen readers.

190 tests passed, the web build and Android sync completed, and source, dist and Android assets matched. Phone interaction and visual confirmation for this revision remain pending.

## Previous milestone · 2026-11-21

V25.5 Neon Home is in visual review on `feat/v25-royal-master`. The owner approved the H6 arena and the wordmark/board composition in `b24c50b`. This revision integrates a transparent emblem, simplifies the bottom navigation and moves help below it. The next gate is a manual Codemagic **RombMaster Cloud Test APK** and owner review on Android. V25.6 remains planned.
