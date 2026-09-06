# Handoff

Updated September 6, 2026, 21:40 UTC. After compaction, read this active handoff and PLAN.md
section 11. PLAN.md is the sole queue; do not create STATUS.md.

## Active follow-up

Build **The Shape of Time**, a book that lets readers explore sustained, nested text-and-image
narratives. The human user is the author. Preserve the creative agent's freedom and persistent
context; do not impose literary metrics, image quotas, fixed scene lengths, or a compulsory critic
pipeline. The author will assess the writing and imagery personally. Do not start another operator
literary study or inject editorial feedback between reader requests.

The author asked us to complete gentle artistic guidance, preparation while reading, a first-entry
controls tour, and **20 completed reader requests** for review. Each new attempt starts empty under
one pinned mechanism. Previous fiction, images and notes belong only in a private referenced archive.
The current attempt obeys that requirement. Do not reset it for interface or documentation changes.

### Completed implementation and live checks

- Small labeled additions to the prose and visual guides invite descriptive breathing room, natural
  conversation, richer/more frequent imagery, closer agreement between pictured and written details,
  and ethnically ambiguous Jay and Tan. Original world and world-essence text are unchanged.
- The author's 3:36 PM screenshots were inspected: the image has an unlabeled bottle, while the prose
  refers to its oak label. This example is development evidence, not a new scene prescription.
- Preparation now works from any encountered publication. It gives the agent the actual source and
  images, existing openings and unread continuation; concurrent readers coalesce. It yields between
  settled tool batches to explicit requests or stale reading. It remains an opportunity to choose
  useful work, not a mandatory creative sequence.
- The guide highlights real controls, supports Next/Back/Skip/Escape and keyboard arrows, remembers
  dismissal, and reopens with ?. It restores reading position and suppresses reading signals while
  touring. Desktop, 390px-wide, and production checks passed. All **34 mechanical tests**, typecheck,
  lint and build passed. Do not repeat them absent a new change, failure or concern.
- The live first-section preparation created **The Back Label**, with three images. Its link appeared
  without a reload after about 16 minutes of background work. Actual warm entry and exact source
  return passed. The next observation, 5.5 seconds after entry including tool latency, had all prose
  and images loaded. This does not promise every opening will beat every reader's pace.
- After request 2, the open root reader received its two additional sections and all nine root images
  without a reload. The source passage and scroll position were unchanged. No alert appeared.

Evidence: [follow-up report](evals/author-feedback-and-preparation-2026-09-06.md). Original infinite-book
preparation/tour source, Context7 Kysely/React docs and official Astra documentation were consulted.
No provider API or model change was introduced by this follow-up.

### Active generation — continue until all 20 complete

The durable driver is **session 7881 / PID 58361**. Do not start a duplicate. It runs:

```sh
mise exec node@24.18.0 -- node --import tsx .local/review-second/run.ts
```

Requests 1–3 are complete. Request 4 continues **The Gentle Route**, work
`work-d99e2e813bc1d7104ac8527f7f340386`: **00767a96-f75e-421d-9b8c-84dabf1bda1c**, created
21:36:15 UTC, now running. Request 3 was the actual root-image exploration
`739762df-9e1b-480e-8364-cea1d567d430`; it completed with two sections and four images. The
interim `after-three.json` records 3 works, 7 publications, 14,867 words including headings/alt and
16 published images. All operations matched the pin.

The first natural context renewal completed successfully before request 4. Operation
**302fa39a-5b68-495d-8424-0211ce18a912** ran 21:36:34–21:38:45; actual usage was 290,059 input
and 5,785 output tokens, settled cost **6.235055** against a 16.851025 reservation. Request 4 then
started normally. Full originals remain saved. The threshold uses the provider's input-token count,
not an estimate from image base64 length. Do not confuse this book-context renewal with Codex
conversation compaction.

The driver continues sequentially through root, child and grandchild requests, without operator
plot instructions. It saves each body, source, dedupe key and ID before submitting. A failed/paused
intent or network error stops it for inspection; no ambiguous provider operation is automatically
purchased again. Once request 5's grandchild exists, the live nested-return walkthrough can be done
while the remaining requests run, using already published links and avoiding extra paid QA.

Files under ignored `.local/review-second/`:

- `ledger.json`: authoritative count and IDs. Begin is already request 1; never create another Begin.
- `run.ts`: resumes incomplete entries; `--through N` stops between requests at a chosen count.
  A nonempty `hold` file stops between requests. **No hold file currently exists.**
- `run-status.jsonl`: compact status written every minute by read-only **monitor session 48585**
  (`watch.ts`). The monitor exits when the ledger reaches 20. Monitor errors never retry generation.
- `observations.jsonl`: more detailed, read-only snapshots from `observe.ts`.
- `after-two.json`: interim scope: 2 works, 5 publications, 10,551 words including headings/alt,
  12 published images; every operation matched the pin. It includes request 3's active reservation.

The first request was **ed8a8cf1-5940-4255-886f-af988132b759**; request 2 was
**decc7f9a-b434-42ab-98a4-1734fbd23ffe**. Initial driver session 5982 exited normally after request 1.
Preparation is recorded separately and is not one of the 20 explicit requests.

Useful local helpers (read-only, no provider purchases):

```sh
mise exec node@24.18.0 -- node --env-file=.env --import tsx .local/progress.ts <since-UTC>
mise exec node@24.18.0 -- node --env-file=.env --import tsx .local/review-second/observe.ts
mise exec node@24.18.0 -- node --env-file=.env --import tsx .local/reader-second-scope.ts <receipt-path>
mise exec node@24.18.0 -- node --import tsx .local/review-second/verify-assets.ts <receipt-path>
```

The second-scope helper includes both earlier allocations, session/renewal metadata, openings,
mechanism, publication scope and the request ledger. Do not use the old first-scope helper for totals;
it omits the first reader attempt from prior spending.

### Edition, deployment and accounting

Active worktree: `/Users/ratpartyserver/git/shape-of-time-agentic`, branch `codex/agentic-world`.
Normal checkout: `/Users/ratpartyserver/git/shape-of-time`, branch `main`.
Retired `art-thing` remains read-only.

- Site: https://shape-of-time-production.up.railway.app
- Railway project: `8b20e07d-c256-44c9-85be-d1c7e50ac83d`; service `shape-of-time`.
- Active schema: **world_reader_20260906_b**.
- Reading key: **shape-of-time:2026-09-06T19:54:14.409Z**.
- Pinned mechanism: **aefcf65a848bbecda3b37c0a26d71e6230712f795c4e268e678bc671408acd4e**.
- Pin receipt: `tests/receipts/second-edition-pin.json`; verified before any generation/publication.
- Live application/main: **1ed691ab831a658eb93f395b1329fb2d8836370c**.
- Git deployment **169d3c85-efdd-4725-b935-1c18b7f5fad3** succeeded; exact `/healthz` matched.
- Local branch includes documentation commits **9b776f6** and **e339e61**, not yet pushed;
  subsequent handoff/report updates may be uncommitted. These documentation changes do not alter the creative mechanism.
- Hosted generation and preparation are enabled. Local `.env` points at the active schema with
  generation disabled. No local API or Vite server remains running.

**No release lock is held.** Helper session 51105 / PID 43609 was released with SIGINT and exited 0
following the tour deployment. The earlier helper was also released. Deploy only through a passing
main push; never `railway up` or manual redeploy. Before any final documentation push, allow paid
operations to settle and use `.local/hold-release.ts` if needed. Always release and verify its exit.

The author explicitly authorized exceeding $150 if needed. Current edition allowance is $150;
prior development cost is **94.697304** and the archived first reader attempt cost **22.053726**,
so prior combined spending is **116.751030** and combined operational allowance **266.751030**.
Settled active-edition spending after request 3 was **25.966703**; its subsequent context renewal
cost **6.235055**. Current request 4 spending is additional. Current monitoring
includes active reservations; do not mistake those for final charges. Unknown outcomes remain zero.
Increase the allowance deliberately if needed for the authorized run, preserve the spending guard,
and never silently reduce Astra/xhigh or the image model. Allocation receipt:
`tests/receipts/second-edition-allocation.json`.

First-attempt archive: `.local/reader-first-preserved-2026-09-06`, referenced by
`archive/reader-attempts/README.md` and `tests/receipts/reader-first-preserved.json`. It contains 92
objects, 70 operations, 20 documents, 8 publications, 10 saved images and 4 sessions. The old schema's
allowance was frozen at its actual cost. `.local/reader-first.env` remains read-only/generation-disabled.
Never copy this archived corpus into the fresh creative context.

### Remaining work

1. Continue the existing driver through all 20 completed explicit requests. Resolve actual failures
   or budget limits without changing the pinned mechanism or duplicating provider work.
2. Verify the final published images, request count, model/mechanism receipts, costs and scope.
   Complete an actual grandchild/source-return journey using existing openings; avoid extra paid QA.
3. Finish PLAN.md section 11, the follow-up report and a small final receipt. Commit, safely push,
   verify deployment and leave no temporary holds or processes that should have stopped.
4. Leave the opening ready for the author. The QA browser has seen the guide; ? can reopen it for
   handoff. New readers still receive the first-entry guide automatically. Leave artistic judgment
   to the author rather than commissioning further criticism.

CUA tab **21**, browser **1**, remains on root visit **94116ec2-0b0d-4da9-b9c7-4d6c33b789f5**.
Current root work: **work-895cb2c0b80c9b201cc2535181c2a612**. The Back Label work:
**work-37e6ef40518cb332d5b65c8c9c3d32cb**; warm visit **c8b4065e-4088-4d5d-a165-0f9e8877cd6a**.
Preparation **a41a6042-d9f6-457b-9052-6bb13184c802** is complete. Its source is first-publication
`3d81106c-9af8-467f-b533-a51863cf42f7`, block `b-d9d899cdb3efaae5736d`, quote offset 164–195.
Root remains on that first section, whose completed preparation cannot repeat.

---

The material below preserves the earlier first-attempt handoff. Its completed sample, old process
IDs and stop instructions are historical evidence. The active follow-up above controls current work.

## Purpose and terminology

Build the book, The Shape of Time: a world exploration harness producing sustained, nested text-and-image
narratives coherent as they unfold. The successful text-only infinite-book is the experiential baseline.
Give the creative agent original context, persistent memory, tools and freedom. No prescribed lengths,
beats, mandatory fact graph, deterministic literary verdicts or compulsory writing/image/critic order.

The human user is the **author**; the overall system is the **book**; its users are **readers**.
Models are the **creative agent** and **critic agent**. The UI is the **reading interface**; individual
narratives are **works** or **nested narratives**. Historical literal session role `author` is preserved
as an implementation identifier, not terminology guidance.

The author asked to finish mechanics and STOP extended operator literary analysis/auto-refinement,
then prepare initial material for personal exploration. Do not restart the study or commission another
operator critique. The creative agent retains its normal option to seek criticism. Existing evidence
establishes coherence only at its recorded scope; the author now judges artistic quality personally.

“About 50 steps” remained ambiguous after terminology corrections to the unit question. The stated
working assumption was roughly 50 reading screens, not 50 paid continuation requests. Four ordinary
requests produced about 72 screens. No length quota was given to the creative agent, and its ordinary
output was retained. No more generation is needed to prepare this sample.

## Completed release and next action

The eight-section sample is complete, all four explicit requests are DONE, and no provider operation
is active. The complete fresh root → child → grandchild → child → root reading journey passed.
The only remaining application change is client selection fix **8379de5**: dismissing exploration
clears native text selection, and reading controls do not recapture an old quote through mouseup.
Actual local regression passed with generation disabled; all 30 tests, typecheck, lint and build passed.
No creative mechanism changed, so this edition remains intact.

Application release **f1bb948d52830cb28bae1d97a6d32f9c1452ebae** deployed successfully through
Git-triggered Railway deployment **f85531a0-a34d-401f-bf84-66982b0b6a69**. Exact /healthz revision
matched. The production passage-selection → close → image-open → image-close regression passed:
correct selected quote, cleared native selection and no revived exploration panel. No generation
was submitted during this check. Subsequent commits completing this handoff are documentation-only;
they contain the same verified application code and mechanism.

The temporary release helper **session54083 / PID97529 was released with SIGINT and exited0**.
No release lock or local generating process remains. Post-release status showed all four explicit
requests complete, unchanged spend and unknown0. The four stale preparation opportunities below
remain ordinary inactive records. Generation remains enabled for future readers.

**Next action belongs to the author:** read and explore the prepared book, then assess the writing,
images and desired experience. Mechanical release work and initial sample preparation are complete.
Do not buy more generation, restart the literary study or change the process without new direction.
If new work materially changes that process, preserve this edition before starting another.

**Deferred request, September 6:** PLAN.md F1 records the author's request to prepare subsequent
sections and the initial material of linked narratives while a reader is reading, following the
original shapeoftime.net experience. This includes coherent text and imagery. Existing frontier
preparation is a starting point; timely preparation for both paths still needs investigation and
improvement. The author explicitly said to add it for later without interrupting current work.
Only the TODO is recorded now; no runtime change, provider call, edition reset or deployment.

CUA tab21/browser1 is the book, with no viewport override. The final handoff leaves its root opening
usable. Use actual controls for any further UI inspection; browser evaluate is read-only DOM.

## Fresh edition and scope

Edition `shape-of-time`, schema **world_reader_20260906**, created17:39:05 UTC. Mechanism pinned
before generation at ca6ef9d:
**2a816eaad04ffb8f85cac75dcb7159af1b26f8070680fd11d9728edd3e1aa9c2**.
Every fresh provider operation matches this pin. The current source/configuration hash was verified
unchanged after the client fix. Creative-agent session **36bc9a8a-ece9-4b51-988d-0bbce2bbfb2e**.
Astra xhigh/all_turns; gpt-image-2-2026-04-21; preparation enabled; renewal threshold250000.

**15,244 words including headings/alt text, 8 publications, 8 illustrations, 3 works.** Actual
651×1027 viewport: root38,158px, The Loaner18,409px, The Receiving Address17,866px, about72screens
including interface space. All eight images loaded. This is a volume/presentation observation, not
a fresh literary verdict. Exact publication/document IDs, revisions, timestamps and budget are in
**tests/receipts/reader-initial-edition.json**; **evals/reader-edition-walkthrough-2026-09-06.md**
records real controls, anchors, timings and verification limits.

| Work | Work ID | Saved visit |
|---|---|---|
| The Shape of Time | work-df04ec75476c0c4bf81baee07105206c | a0f22e20-0f70-4d2e-a78b-cf54f206b65d |
| The Loaner | work-61c55b70bacbbb990880b81ef4c4b892 | 1219b5c1-f55d-404b-b7ef-dcb6375dc9b3 |
| The Receiving Address | work-87d080f6543119a057fbda3cfd2ebc56 | bf34961b-588e-4156-bfae-5a725d7192d7 |

Root sections: The Green Cap, Half an Hour, Tuesday, The Forwarding Card. The Loaner: Seventeen,
The Recording. The Receiving Address: The First Stop, The Second Photograph. Last publication
813f65fb-abe4-4dc9-80f0-30bf2559d970 at19:02:53 UTC, receiving-address/002-the-second-photograph.md
rev2, document1145d2b2-828c-4050-b5df-c05e5e4121d4. Normal final continuity notes followed; no
operator narrative feedback was inserted.

Four DONE requests: Begin685bfcad-6dae-48e5-a6f5-bac1fa9e8005;
phone exploration2ee1da0a-90f1-4dda-beef-1b66d3f33648;
root continuationec290ce7-a716-4cd6-9725-947aab0e2a23;
grandchild2923d71a-d7c6-4b84-9d59-027b4dbf45e8. Both explorations used actual encountered
sources, with no operator title, angle or premise.

Four stale unstarted preparation records remain: a3882510-1350-477e-8bd2-d0db4c44bcfd,
c77a77a4-c8dd-469f-ae60-9f56a3cecf48, a7e5d675-4618-459f-b1a5-ef12d4f5d5a2,
2efbba22-28d5-46dd-90be-9bc7fd295f98. They are not failures or paid operations. Do not delete,
duplicate or cancel them. Ordinary future reading can refresh applicable preparation.

## Budget — combined, do not reset

The author explicitly authorized: **“You can go over the $150 cap if needed.”** A necessary
increase is authorized without asking again. No increase was needed for this release. Keep the
spending guard and combined accounting; this does not restart the deferred literary study.

At19:05:36 UTC, after all explicit requests completed: development **$94.697304** frozen;
reader edition **$22.053726** committed; combined **$116.751030**; unknown0. Reader allocation
remains **$55.302695**, with **$33.248969** available from the initial combined allowance.
Receipts: tests/receipts/edition-allocation.json and reader-initial-edition.json. Later reader
activity can change spend; query current status before further funded work. Do not rerun freeze,
reset either edition's accounting, or treat a new schema as a new allowance.

## Repositories, deployment and local operation

Active /Users/ratpartyserver/git/shape-of-time-agentic, branch codex/agentic-world.
Normal /Users/ratpartyserver/git/shape-of-time, main; remote torgbuiedunyenyo/shape-of-time.
Retired art-thing is read-only. Preserve historical refs, archives and every session transcript.
Single development agent; no subagents or goal tool. No Docker or staging required.

Site https://shape-of-time-production.up.railway.app
Railway project8b20e07d-c256-44c9-85be-d1c7e50ac83d; production82e1c3e8-e2c1-4023-afa2-b17dc6dc6ec3.
App39bf3c12-b426-40ce-836a-2839ea1bc213; Postgres294c4570-91e2-4bb2-8639-4a802a475ab8;
bucket545eb437-32e7-4100-a154-3cffd145fac1. DB proxy iriguchi.proxy.rlwy.net:41493.
Assets automatically use schema/key; no ASSET_PREFIX. Mechanical tests use world_checks.
Hosted DATABASE_SCHEMA=world_reader_20260906, READER_EDITION=true, PROVIDER_BUDGET_USD=55.302695,
GENERATION_ENABLED=true, PREPARATION_ENABLED=true. Deploy only from passing main pushes; never
railway up, manual redeploy or Deploy Latest Commit to bypass Git integration.

Ignored .env follows the reader edition, generated by scripts/configure-local.py, with local
generation false. Old .local/development.env is read-only evidence, not authority to restore150
or generation. Never print secrets. Local API59574 and Vite20612 stopped; QA tab22 closed.
The temporary release helper is also stopped; no local background job remains.

Read-only compact status:
`mise exec node@24.18.0 -- node --env-file=.env --import tsx .local/progress.ts [ISO-since]`.
It always includes all unfinished intents; since filters documents/publications only.
`.local/reader-initial-scope.ts [output-path]` records counts/IDs/mechanisms/cost without buying
calls or reading drafts/critiques. Inline ESM also needs --input-type=module.

## Remaining limits

Prepared material is immediately readable. Cold generation is slow, particularly behind another
request in the single creative queue: first root publication about5minutes, first child18minutes
including11queued, first grandchild42minutes including32queued. Do not claim this latency is solved.
No novel-length or indefinite coherence claim is established. The author will assess the actual
writing and images before deciding further creative changes. Do not replace that with more tests,
automatic refinement, a new architecture, or an unsolicited literary assessment.

## Completed mechanics and preserved evidence

**30 tests, typecheck, lint, build passed** for application release a1bef58 (included in live ca6ef9d).
New checks use real Postgres and real persistent Web Storage across three processes: mechanism receipt,
refusal to spend after changed renewal settings, replay of existing receipts, and edition-specific
visits/bookmarks/source quotations. No deterministic literary checks. Compiled mechanism file loads.
Updated configure-local.py syntax and actual configuration readback also verified.

Earlier actual production journey proved root→child→grandchild→exact returns, mixed reflow/font size,
reload/bookmarks/ancestry, image regions/cross-paragraph selection, prepared openings, concurrent pending
continuation/exploration, no focus stealing, and clearing a consumed continuation's stale status.
Detailed reports: evals/nested-reader-and-recovery-2026-09-06.md and sustained-reading-2026-09-06.md.
The fresh-edition journey also passed; see the walkthrough report. Do not repeat these experiments without a new defect.

Real restart resumed same saved Astra response and draft once (tests/receipts/astra-restart.json).
Complete earlier corpus restored into world_restore_nested_renewed with all rows/objects matching,
including full context; evals/corpus-recovery-2026-09-06.md. Real export size failure was fixed with
streaming JSONL. Individual rows/objects still must fit memory. No duplicate paid investigation needed.
Native renewal: first manual full canonical window retained and replayed; later natural250k boundary
retained10canonical items and continued into actual root5. Receipts astra-native-renewal and
astra-automatic-renewal. Grouped5-tool response and ordered tool recovery verified (astra-grouped-tools).
Opaque provider identifiers are not an indefinite retention guarantee. Full originals remain archived.

## Private development archive — never load into the reader edition

Development schema **world** remains preserved, spending frozen, no active request. Last runtime9aee4b0.
Completed run: **26,329 words** including Markdown/alt text, **10 publications /3 works /18 published
images**.22saved image assets include rejected studies. Builder read root1–4, WASH1–3 and wedding1–2;
root5 publication was retained without another operator literary analysis. The author will assess the
fresh reader edition. Old literary observations belong to that development corpus, not the new one.

Complete export **.local/development-complete-2026-09-06**:228ops,43documentrevisions,11sessions,
10publications,286storedobjects. Manifest SHA:
**3c139b89ebb7d8fd1c2a452732767f78d5901423810ca797041bcb1e51e976cb**.
Small receipt tests/receipts/development-final-export.json. Snapshot also contains development-index,
deployment-history and allowance JSONs. For its exact schema, use **9aee4b0** to restore: it predates
the new mechanism column. The larger final export was not separately restored; prior full restore proof
is retained. No repeat restore just for added content. Initial incomplete export without manifest is
not a backup; details remain in historical handoff/report.

Historical operations have exact request/response/tool evidence, but not every executing code revision
was directly recorded. Deployment createdAt is NOT activation time. Use reports, receipts and known
interventions; don't retroactively invent a single pinned process for this mixed corpus. A broad
contextual review was manually linked once to the development creative agent; no prose was spliced.
That review, notes, stories, illustrations and intervention never enter the fresh edition's context.
Further attribution discussion: evals/edition-transition-2026-09-06.md. Earlier handoff at ca6ef9d
retains full historical IDs/details; there is no reason to reconstruct them for normal reader work.

## Authored source and final limits

Creative/critic models GPT-6 Astra xhigh; imagery gpt-image-2-2026-04-21. No fallback or effort reduction.
Full original4512-word world SHA **e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c**
and main-template essence/prose guidance preserved; natural explanation allowed, no didactic quota.
Approved inked reportage/transparent color medium. Jay/Tan trajectory is context, not a beat schedule.

The earlier development sample showed worthwhile connected development and identified prose/visual
risks, with a grounded critic review. It does not establish novel-length or indefinite coherence.
The author now wants to judge further artistic quality personally. The mechanics and fresh sample are ready; do not spend the remaining allowance on more operator
reviews or speculative frameworks.
