# Handoff

Updated September 7, 2026, 02:31 UTC. After compaction, read this active handoff and PLAN.md
section 11. PLAN.md is the sole queue; do not create STATUS.md.

### Latest steering: reader controls correction F6 — finish this before resuming the sample

At10:18PM Eastern the author rejected reader narrative direction and asked for entry as soon as
the first pages exist. Read PLAN.md F6 at the end of section11. Screenshot shows The Back Label's
second illustration exploration. Both actual explorations53618c9d and a49dba98 are still queued;
neither has any destination pages yet. They wait behind the root continuation23ca1f50.
The API already exposes a first publication while its request is running; it does not wait for
completion or several sections. The misleading status text treated queued and running as identical.

Local changes remove the direction input/outgoing angle, title-premise creation on the shelf and
guide invitation to direct the narrative. New OpeningPanel distinguishes waiting/working/ready,
and offers entry immediately on a readable result. Keep reader source exploration and read-only
search. Existing empty-angle request hashes are retained so reload cannot duplicate an opening.
All code changes are client-only. The generator and edition pin stay unchanged. No reset is needed.
The historical raw API schema still has optional angle/title fields; this slice changes the reading
interface and outgoing requests, not the creative runtime or prior request evidence. No active
reader request contains an angle or title. Do not claim an API-level rejection was implemented.

Application commit **8e80341** is ready. Normal main was safely fast-forwarded to it from1ed691a;
origin/main is still1ed691a. **Do not push until the release helper acquires its hold.** All38tests,
typecheck, lint and build passed again after applying the same opening-status wording to the shelf
and waiting page. Current mechanism hash exactly matches the pin. New real-Postgres/API check establishes first-publication
entry during a still-running exploration, with later unpublished material excluded. OpeningPanel
checks cover no narrative input, queued/working distinction and an enabled entry before completion.
Actual local in-app QA opened The Back Label's same second image: the panel has no text field,
and the action is visible/usable. No paid QA request was submitted. Local tab24 is temporary.

**Automatic driver session21872/PID89015 is stopped.** `.local/review-second/hold` is present.
Queued driver request13 **30726e4a-1826-45a1-9761-aad618b22c54** was deliberately marked paused
for the reader-interface release, while it had no session/provider work. Original status is in
`.local/review-second/reader-release-hold.json`. This stops the next queue dispatch after the
current root request finishes. It is maintenance, not a generation failure.
**Release-lock helper session5345 / PID94405 is waiting** for the current paid work to settle.
Do not deploy until it reports the lock held and no active operations. Monitor79831/PID86952 runs.
Local read-only API session43685/PID94117 and Vite session13841 are running for QA; stop after release.

Next: finish local evidence and commit explicit paths; acquire release hold; safely fast-forward
normal main and push; verify Git deployment and actual live controls. **Before resuming, prioritize
the author's live exploration:** run `.local/review-second/prioritize-live-reading.ts` with the
local env while the release lock is held. It archives the old ledger, withdraws the unstarted
automatic child request13 (retained as cancelled, no work or spending, never counted complete),
then records actual root23ca as13 and explorations53618c9d/a49dba98 as14/15. This avoids making the
author wait behind another automatic continuation. The driver now ignores cancelled automatic
requests and keeps only exact source anchors in the ledger; full original context stays in the DB.
Then remove the local hold file, restart the ledger driver with `--env-file=.env`, release the
advisory lock and continue to20. Do not restore/retry the withdrawn automatic child request.
Finish final scope/images/cost/handoff after all20. Earlier checkpoint below is preserved context;
this section controls the actual process/hold state.

### Current recovery checkpoint — supersedes older process/count entries below

The author revoked the previous OpenAI credential and explicitly supplied/authorized its replacement
in Railway, then renewed the instruction to finish all20requests. Replacement is stored and its
Astra model access authenticated successfully. No credential is recorded in this document.
Configuration-triggered deployment **0d3607e3-d58e-4993-a2dc-b5745b029615** succeeded at the same
application revision1ed691a; health matched and subsequent Astra generation succeeded. This activates the new credential and updated allowance; no source or
creative mechanism change and no edition reset.

**12 requests are complete in production.** The original driver and monitor exited during the
conversation interruption. Do not rely on their older session/PID entries. Ledger reconciliation
through12 completed. The resumed driver is **session21872 / PID89015**; monitor **session79831 / PID86952**.
**Keep this existing driver running through all20; do not start a duplicate.**

Driver request13 is child continuation30726e4a-1826-45a1-9761-aad618b22c54, queued. The author also
submitted a real root continuation through the reading interface during the restart:
23ca1f50-544d-4404-8f26-df852abd72af, currently running. It has been adopted as ledger entry14
instead of buying the originally planned automatic root continuation. Submission chronology for
entries13/14 is reversed. Both still count toward20 explicit requests total. Saved ledger explains
the adoption; no active provider call was interrupted. Check for further actual reader requests
before final counting so they are not mistaken for preparation or operator requests.

Entry15 is another actual reader exploration,53618c9d-c645-4283-8138-772a63889f8a, queued. The
local driver now adopts existing explicit requests made through the interface before creating more
automatic requests, up to the requested20. This changes only the operator sample driver, not the
book's mechanism. **The driver now requires `--env-file=.env`** for read-only counting of intents:
`mise exec node@24.18.0 -- node --env-file=.env --import tsx .local/review-second/run.ts`.
Driver sessions26753/31318 were deliberately stopped to reconcile the ledger; no service or paid
operation was interrupted. Do not resume those obsolete sessions. Monitor may temporarily
under-count completed adopted requests until the driver reaches their ledger slot; query intent
statuses when giving an exact count. The root continuation is currently generating an image.
All43publishedimages across4works/23publications passed availability checks at02:07UTC; receipt
`.local/review-second/after-twelve-assets.json`.

Context renewal **ad9a0766-935c-400d-8bee-04e842adbba1** settled successfully at02:07:44,
cost7.448105. Subsequent preparation **2cbeb238-7116-40cf-85b2-4163662b82ae** failed at input-token
counting with502, before a new paid operation was created. Its saved session may resume after the
key is active; its existing session was requeued, with failure/recovery evidence saved at
`.local/review-second/key-rotation-recovery.json`. Other ordinary preparation opportunities are
queued as the author reads. No ambiguous provider operation needs replay.

**No release lock is held.** Session51684 / PID85125 acquired only after renewal settled, was
released with SIGINT after deployment, and exited0. Subsequent real Astra operations succeeded.

Edition allowance is now **250**, increased by100 under the author's explicit authorization.
Prior combined spending remains116.751030; combined operational allowance366.751030. Exact receipt:
`tests/receipts/second-edition-allowance-extension.json`. Local configuration uses the new credential,
active schema and allowance, with local generation disabled. No secrets were printed or committed.

At02:10UTC the scope was46,183words including headings/alt,23publications,4works and43publishedimages;
every operation matched the pin. After the renewal settled, edition cost was128.934298,
prior116.751030; unknown0. Later generation is additional. Interim receipt:
`.local/review-second/after-twelve.json` includes the next request reservation. All34mechanical tests
and real controls/preparation/nested-return checks below remain valid. No code or artistic mechanism
changed for key rotation; do not rerun paid QA or the literary study.

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

Requests 1–5 are complete. **Request 6** continues The Second Handle,
work `work-c1281da55e3c8136afd25dc2de814198`: **62fb89c5-1faf-4163-bb53-cb82f7537b46**, created
22:27:28 UTC, running. The `after-five.json` interim receipt records **4 works, 10 publications,
20,602 words including headings/alt and 21 published images** (24 saved images including unused
variants). Every operation matched the pin. At22:29, active-edition committed spending including
request6's reservation was51.1700915; remaining98.8299085; unknown0. Prior116.751030 remains separate
in combined accounting. Current allowance150 is unchanged; increase deliberately if later needed.

Request5 (610d461f-9234-4107-bbd4-ae68d87c9180) completed with the first grandchild section, whose
actual reader controls and imagery were already verified. No more UI journey is needed absent a
new defect. Continue the existing driver through20, then finalasset/receipt/accounting checks and
safe documentation release. Never end at a partial request count merely because generation is slow.

Request 3 was root-image exploration `739762df-9e1b-480e-8364-cea1d567d430`; request 4 was
continuation `00767a96-f75e-421d-9b8c-84dabf1bda1c`. The root link to The Gentle Route exists:
`opening-0e5568a8566386678de3bc29c6076142`, label “The Gentle Route — Tan before the shop”.
**The full two-level navigation check passed at22:25UTC**, while request5 was still active.
Root image → The Gentle Route (visit6b4b70b4-1101-45e5-9ec4-8a757456d278,4sections/7loadedimages)
→ The Second Handle (work-c1281da55e3c8136afd25dc2de814198,
visit7dc4a0c7-46cd-432a-81d3-0d68113adab2,1section/2loadedimages). Both Return buttons restored
exact source blocks: child b-6e246df7f629e95bb2ba at97.38px; root image b-3c867dcc12b08fa95ab6
at99.97px. No new paid/request intent was submitted by QA. Evidence is in the follow-up report.
No more navigation QA is needed absent a defect. Root remains on the first-section image.

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
- Local branch includes documentation commits **9b776f6**, **e339e61** and **44bff98**, not yet pushed;
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
   The actual grandchild/source-return journey has passed; avoid extra paid QA.
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
