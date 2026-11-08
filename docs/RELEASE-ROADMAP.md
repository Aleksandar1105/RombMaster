# RombMaster: Android release roadmap

Goal: a reliable, polished game suitable for a Google Play release, with an
optional monetization phase after the core experience is validated.

## 1. Stabilize the game

- Step 1: cancel stale AI and result callbacks (PR #1).
- Step 2: undo back to the last human decision (PR #2).
- Step 3: one pointer input path for mouse, touch and pen; ignore secondary
  contacts and non-primary buttons. Automated integration coverage includes main.js.
- Step 4: manage a single animation loop across restart, menu exit and completion;
  cancel stale frames and permit a one-off repaint of a completed board.
- Step 5: save versioned move logs, reconstruct validated boards and undo history,
  offer Continue, migrate valid legacy snapshots and report storage failures.
- Step 6: coordinate native/visibility/page lifecycle events; pause game actions,
  frames and audio, save progress, and resume at most one AI/result action.
  Android Back closes help/result first, then saves to menu, then exits Android.
- Next: integrated review and physical Android validation of steps 1–6, followed
  by mobile layout and turn-status improvements.

Physical-device checks for step 6: lock/unlock during human and AI turns; switch
apps during an AI capture chain and the result delay; reopen after OS process
termination; press Back in help, result, game and menu. Confirm no hidden moves,
duplicate responses, delayed sounds, lost saves or blocked exit. Automated tests
stub platform events and cannot prove device behavior. If Android kills the
process, restoration uses Continue rather than resuming an in-memory timer.

Gate: regression tests and web build pass; actual Android play tests still required.
Draft pull requests and successful builds are not release approval.

## 2. Polish gameplay and mobile UX

- Verify small screens, landscape, safe areas, large text and high refresh rates.
- Improve line selection and show whose turn it is, AI thinking and extra turns.
- Add a short interactive tutorial explaining the initial 2–2 score and captures.
- Add sound, vibration and reduced-motion preferences.
- Improve AI strategy and benchmark response time on target phones.
- Add local statistics and alternating first player for rematches.

Gate: complete matches and interruptions work on physical Android devices;
new players can understand the rules without external instruction.

## 3. Prepare Android distribution

- Audit and update dependencies and Android tooling with regression testing.
- Confirm the permanent app name and application ID; establish versioning.
- Prepare a signed release Android App Bundle and secure signing arrangements.
- Verify current official Google Play requirements at submission time, including
  target API, account-specific testing, listing, audience, content rating,
  privacy/data disclosures and any SDK-related obligations.
- Prepare store icon, screenshots, descriptions, support contact and privacy page.
- Run the applicable test release process and resolve device/crash reports.

Gate: release checklist, real-device evidence and current official requirements
are satisfied. Publishing and account setup are explicit later tasks.

## 4. Validate monetization

No advertising, billing or analytics SDK is approved or added by this roadmap.
Decide the intended audience, initial countries and languages first.

Candidate models to evaluate with the owner:

- Optional rewarded ads for optional benefits that do not undermine fair play.
- A paid ad-free option if advertisements are introduced.
- Cosmetic themes as a later possibility.

Avoid interrupting an active move with an advertisement. Define frequency limits,
offline behavior and purchase restoration before implementation. Verify current
official advertising, billing, consent and audience requirements before selecting
SDKs. Test with test ads and test purchases before release.

Gate: reliable purchases/restore, appropriate disclosures, no gameplay regression,
and evidence that monetization does not harm the player experience.

## Working agreement

Proceed in small reviewed changes. Run tests and builds in the development
environment without introducing GitHub Actions workflows or Actions artifacts.
Do not assume draft PRs are merged, Android-tested or published.
Revenue is a goal, not a guarantee; assess player interest and retention before
investing in additional monetization features.
