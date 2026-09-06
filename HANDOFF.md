# Handoff

Updated September 6, 2026 during initial generation of the fresh reader edition.
After compaction read this and PLAN.md P6. PLAN.md is the sole queue; do not create STATUS.md.

## Purpose and terminology

Build the book, The Shape of Time: a world exploration harness producing sustained, nested text-and-image
narratives that remain coherent as they unfold. Successful text-only infinite-book is the experiential
baseline. Give the creative agent original context, persistent memory, tools and freedom. No prescribed
lengths/beats, mandatory fact graph, deterministic literary verdicts or compulsory writing/image/critic order.

The human user is the **author**. The overall system is the **book**. Its users are **readers**. The
model generating narratives is the **creative agent**, and the model providing criticism is the
**critic agent**. The UI is the **reading interface**. Individual narratives are works or nested
narratives. A reader continuation request may cause several agent turns and yield several screens.
Historical literal identifiers such as session role `author` remain preserved, not terminology guidance.

The author asked to finish mechanics, STOP extended operator literary analysis/auto-refinement, then
prepare initial material for personal exploration. Existing evidence establishes coherence only to its
tested scope. No additional operator critique or development-corpus expansion is needed. The creative
agent retains its normal freedom to ask its own critic under the same process.

The request was about 50 “steps.” Clarification of screens versus reader continuation requests remained
unanswered after the terminology correction. Working assumption, stated to the author: **roughly 50
reading screens**, across the fresh root and nested narratives. This is preparation volume, not an
output quota supplied to the creative agent. Do not purchase 50 continuation requests by assumption.

## Latest reader progress

**Active UI fix, about 18:12 UTC:** a native text selection survived closing exploration and bubbled
through a subsequent image-control mouseup, reopening the dismissed panel and hiding its pending
status. Reproduced in actual UI before editing. Client-only fix clears native selection on close
and ignores control mouse/touch events for text selection. No creative mechanism change or reset.
Full gates session 81868 PASSED (30 tests, typecheck/lint/build), and the actual local browser
regression passed without submitting any generation. QA tab22 closed; local API/Vite stopped.
Release lock session **54083**, PID **97529**, is waiting for the current creative run
to finish, then will hold the worker safely for Git deployment. It MUST be released with SIGINT
after deployment verification (`kill -INT 97529`). Never leave that lock held at handoff.

The Loaner first publication 8dc9b143-4da6-4e3d-b130-a61caa96dcc3 (loaner/001-seventeen.md,
doc 67cae80a-7cf6-4f6d-91eb-42c72131f282) published 18:06:43. Work
work-61c55b70bacbbb990880b81ef4c4b892, visit 1219b5c1-f55d-404b-b7ef-dcb6375dc9b3.
10,461 px at 651×1026, one loaded image, about 10 screens. Actual child→root restored selected
phone-region center to y=99.71 px (target100). Shelf Resume reused the same child visit.

Selected two actual child paragraphs about the departing guest's unfinished photograph export,
with no supplied angle. Grandchild request **2923d71a-d7c6-4b84-9d59-027b4dbf45e8** is queued
behind root continuation. The Loaner creative run is still developing a second illustration;
image operation 5cf4e23c-e0af-4553-a3fe-edc06279dfa2. Do not duplicate requests. Current root+child
are about30screens. Existing queued work may take the final sample somewhat beyond50screens;
do not impose a creative-agent quota or initiate more requests before measuring it.

The fresh root now has two illustrated publications:

- root/001-the-green-cap.md rev1: publication ae3d5045-de5e-495f-99e1-c1ef478a43e2,
  document 0734bff7-94ac-4347-911f-42736746275d, published 17:46:04 UTC.
- root/002-half-an-hour.md rev2: publication 87badac1-d107-4377-8d36-b9014d553399,
  document 444b166d-5e90-4306-a2ee-74193041f400, published 17:58:05 UTC.

Root work work-df04ec75476c0c4bf81baee07105206c. Actual UI Open entered root visit
 a0f22e20-0f70-4d2e-a78b-cf54f206b65d in in-app tab 21, browser 1. At 651×1026/default
text, root document height is 20,067 px (roughly 20 screens), with both illustrations loaded.
First publication was about 10 screens. Save place→reload preserved the visible block positions;
second publication appearing also retained the first source block at the same 777 px top.
The builder checked presentation and navigation, without another literary assessment.

Clicked Look closer→Choose a detail, selected the visitor phone in the first image, then Open as a
book with NO supplied angle/premise. Exploration 2ee1da0a-90f1-4dda-beef-1b66d3f33648 was queued
17:48:43 UTC and began after Begin completed at about 17:59. Source image block
b-417bc2c01bed4dcc1d6c; region x=.3788646086252746, y=.7034339229968782,
width=.15222238739408356, height=.11162975075566128. The source remains readable.
The exploration dialog is now closed. Root preparation a3882510-1350-477e-8bd2-d0db4c44bcfd is
queued and stale; no need to duplicate it. It can reuse existing second publication when serviced.

Saved the source place and clicked Continue reading once after root2 publication:
reader continuation ec290ce7-a716-4cd6-9725-947aab0e2a23 is queued behind the exploration.
Do not repeat it. This should add root material while nested navigation is checked.
Latest Astra operation f67be7f8-3a9b-415f-be16-53bc3b1e1d0c was polling at 18:00:30 UTC.
Query fresh with .local/progress.ts since 17:40. No local generation/helper process is running.

**Next:** enter the phone narrative through its saved opening when ready; verify exact source return.
An actual source in that child can open a grandchild. Together with the pending root continuation,
this should approach the roughly 50-screen initial sample. Stop initiating preparation once that
scope is met. Do not commission operator literary reviews or alter the pinned creative mechanism.

## Exact live position

Production ca6ef9d8d4ddf8b78dc8431973e7f15315e81fba is LIVE. Git-triggered Railway deployment
63d7e34a-3981-4ff4-8a48-60c2ef8b72b3 SUCCESS and exact health revision verified.
Normal main and active branch are at d064c9a, a documentation/receipt commit following deployment;
it is not pushed yet. Current additional edits are documentation only. Finish and commit the
reading evidence, fast-forward normal main, then push/verify when generation is at a useful boundary.

Fresh reader schema world_reader_20260906, edition id shape-of-time. Mechanism pinned before any
generation: 2a816eaad04ffb8f85cac75dcb7159af1b26f8070680fd11d9728edd3e1aa9c2, revision ca6ef9d.
Local source and effective configuration matched the deployed pin exactly. New provider receipts
contain the actual mechanism outside creative source context. Runtime/source/prompt/dependency
hashes and effective settings are preserved; client-only edits do not affect that record. A mismatch
pauses generation; it never automatically clears an edition. Fingerprints are conservative change
signals, not semantic judgments. Preserve previous records when deliberately changing a process.

The in-app browser verified a clean shelf, no previous visits/bookmarks/discoveries, and unavailable
old development root/image routes. The fresh edition had zero documents/publications before Begin.
Begin request 685bfcad-6dae-48e5-a6f5-bac1fa9e8005 is DONE. Creative-agent session
36bc9a8a-ece9-4b51-988d-0bbce2bbfb2e. First completed operation
dba7872c-baf3-4128-8ab9-00777374a2b1 confirmed Astra xhigh/all_turns and matching mechanism.
Receipt: tests/receipts/reader-edition-pin.json.

CUA tab 21, browser 1: https://shape-of-time-production.up.railway.app/read/a0f22e20-0f70-4d2e-a78b-cf54f206b65d
No viewport override. Get compact AX state instead of dumping the full narrative. Browser evaluate
is read-only DOM; use actual controls for requests and navigation. At final handoff leave the book
readable and mark the tab deliverable if the current browser API supports it.

## Budget — combined, do not reset

Original authorized provider allowance **$150 combined**, including text, imagery, criticism and renewal.
Development completed at **$94.697304** (unknown0), and its allowance was frozen at that committed spend.
Only **$55.302695** was allocated to the fresh reader edition; fraction of a cent left unallocated.
Receipt tests/receipts/edition-allocation.json and ignored .local/edition-allowance-2026-09-06.json.
Do not rerun freeze or restore a150 allowance on either edition. Current reader commitment **6.4449205**,
remaining **48.8577745**, unknown0; includes active reservation. Query fresh. Combined commitment is
94.697304 plus current reader commitment. A new schema is not a new authorization.

No active release lock, export, local critic or provider investigation. Unified sessions79048(lock),
49867(export),32375(freeze),28068(gates),91586(push),42924(pin receipt),29772(live check) all finished.
Do not restart them. New creative work runs only on the hosted worker; local generation remains false.

## Repositories, host and local commands

Active /Users/ratpartyserver/git/shape-of-time-agentic, branch codex/agentic-world.
Normal /Users/ratpartyserver/git/shape-of-time, main. Remote torgbuiedunyenyo/shape-of-time.
Retired art-thing is read-only. Preserve historical refs, archive and every Codex/Claude session transcript.
Single development agent; no subagents or goal tool. No Docker or staging needed.

Site https://shape-of-time-production.up.railway.app
Railway project8b20e07d-c256-44c9-85be-d1c7e50ac83d; production82e1c3e8-e2c1-4023-afa2-b17dc6dc6ec3.
App39bf3c12-b426-40ce-836a-2839ea1bc213; Postgres294c4570-91e2-4bb2-8639-4a802a475ab8;
bucket545eb437-32e7-4100-a154-3cffd145fac1. DB proxy iriguchi.proxy.rlwy.net:41493.
Assets automatically use schema/key; no ASSET_PREFIX. Mechanical tests use world_checks.
Railway variables read back: DATABASE_SCHEMA=world_reader_20260906, READER_EDITION=true,
PROVIDER_BUDGET_USD=55.302695, GENERATION_ENABLED=true, PREPARATION_ENABLED=true.
Set using --skip-deploys before passing main push. Never railway up/manual redeploy as a fallback.

Ignored .env now follows the reader edition, refreshed by scripts/configure-local.py; generation false.
Old selected config preserved in .local/development.env for read-only forensics. It is NOT authority to
restore its old150 budget or generation state. Never print either file or secrets. The helper now copies
active schema/budget/preparation/pin flags rather than hard-coding development. It always disables local
provider generation. No new packages installed.

Run: mise exec node@24.18.0 -- node --env-file=.env --import tsx .local/progress.ts [ISO-since]
Current useful since:2026-09-06T17:40:00Z. Avoid full response/session dumps unless needed.
Inline ESM additionally needs --input-type=module. Do not print full Railway status/config/environment.
Railway/OpenAI skills read previously; this slice Railway deploy/configure references, Context7 Kysely
and Node Web Storage docs, and live CLI flag support checked. No new API mechanism beyond provenance.

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
Do a concise actual journey in the fresh edition; don't repeat every expensive experiment.

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
The author now wants to judge further artistic quality personally. Finish mechanics and prepare the
fresh sample; don't spend the remaining allowance on more operator reviews or speculative frameworks.
