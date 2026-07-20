# QA — No-spend production reader acceptance walkthrough (2026-07-19)

Production: https://shape-of-time-production.up.railway.app at main `d9aec71`. Run via
`agent-browser` CLI (real Chromium; the in-app Browser extension was not connected — re-verify
in-app if desired). $0 spent; Next was never pressed from root folio 8 or map folio 2; the
missing-title dialog was cancelled, never confirmed; no repo file the instruction protected was
touched. Screenshots: `~/shape-of-time-archives/walkthrough-2026-07-19/` (01 library desktop,
02 THE DEFECT, 03 title dialog, 04 folio 390px, 05 folio 320px, 06 library 320px).

## DEFECT 1 — release-blocking: raw contract error rendered on the resting-point folio

- URL: `/books/shape-of-time/folios/root-folio-08`. Viewport: desktop 1280px. Reproduced twice,
  including a fresh direct load.
- Gestures: Library → Open Shape of Time → Next ×7 (or direct URL).
- Expected: resting-point front matter only ("A resting point… Shape of Time continues.").
- Observed: raw string `official token count failed; counting failure blocks generation`
  rendered below the navigation — a FableContractError detail reaching the page unrendered.
- Two roots to fix: (1) READER: a ledger/contract `detail` must never reach the page raw — the
  preparation failure needs a diegetic posture or silence, not machine text (art-thing law:
  "loud in the ledger and silent in the UI is silent" — and machine-code-loud in the UI is
  worse). (2) RUNTIME: merely loading folio 8 fires the folio-9 preparation attempt and its
  official count FAILS in production every time — most likely ANTHROPIC_API_KEY is not reaching
  the deployed runtime's count/send requests (key IS set on Railway service shape-of-time,
  project lucky-magic — verify the app's config actually reads/forwards it). All failures
  blocked at count = $0 spent; the money gate held, the presentation did not.

## Passed (all reproducible)

1. Library + cover entry: shelf starts with only the root; Open lands on folio 1 "Payment".
2. Root 1–8 and "The Map on the Wall" 1–2 all render (headers, ordinals, plates where present).
3. Previous/Next within existing pages correct in both books.
4. Keyboard arrows navigate both directions. Mobile swipe: INCONCLUSIVE by instrument —
   synthetic touch/pointer events (isTrusted:false) don't navigate; needs a real device or
   in-app Browser; not claimed as a defect.
5. Suggested aperture on folio 7 ("The maps were always becoming wrong.") opens the Map book,
   no spend.
6. Back to passage returns to root folio 7 with the source phrase in the viewport.
7. Bookmark → "BOOKMARKED"; fresh load offers "Continue reading — Resume The map"; resume lands
   on root-folio-07. The Map book joins the shelf only after discovery.
8. Filter narrows correctly ("Map" → one book); unmatched shows "No discovered book has that
   title."
9. Missing-title dialog: "A book latent here… Nothing is generated until you confirm." Close
   cancels cleanly; nothing created.
10. Layouts 1280/390/320px: no horizontal scroll, controls reachable, images load.

## Consecutive literary + visual review of the ten folios — GOOD

Root reads as one causal chain (gift → return → band → dated promise → venue rupture → repair →
map → yes); class texture earned in scene ("*with me* covers a guide…"); exposition only where a
decision needs it; folio 8 rests at a true boundary, no cliffhanger. The child book proves
premise independence: Lagos ferry navigator, chalked current traces on the terminal wall —
world physics inherited, root plot not recast. Plates (root 1, map 2, others) carry
scene-faithful alt text at 1536px; text-led folios read as intentional. Nothing reads as slop.
This is materially better than the rejected pre-guidance baseline.

## Next actions agreed with owner

Fix Defect 1's two halves (reader rendering of preparation failure; runtime key wiring +
verify production counting succeeds), then re-run the folio-8 check. Swipe verification on a
real device or in-app Browser remains open.
