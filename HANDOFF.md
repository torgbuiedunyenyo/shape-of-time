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

## Exact live position and single next action

Production **ca6ef9d8d4ddf8b78dc8431973e7f15315e81fba** is LIVE. Git-triggered Railway deployment
**63d7e34a-3981-4ff4-8a48-60c2ef8b72b3 SUCCESS** and exact health revision verified.
Normal main and active branch both at ca6ef9d. Local documentation/receipt commit follows the deployment: this handoff, transition report and
reader-edition-pin.json record completed deployment, with no runtime changes. Not pushed yet.

**Fresh reader edition exists**, schema **world_reader_20260906**, edition id shape-of-time.
Its mechanism was pinned before generation, hash:
**2a816eaad04ffb8f85cac75dcb7159af1b26f8070680fd11d9728edd3e1aa9c2**.
Recorded revision ca6ef9d. Local source/effective config matched the deployed pin exactly. New provider
receipts also contain the actual mechanism outside creative source context. Runtime/source/prompt/
dependency hashes and effective settings are preserved; client-only UI edits do not affect that record.
Mismatch pauses generation; never automatically clear an edition. Fingerprints are conservative change
signals, not semantic judgments. Preserve previous records when deliberately changing a process.

In-app browser verified a clean shelf: Begin, no previous visits/bookmarks/discoveries. Old development
root/image API addresses both unavailable. Before Begin, reader edition had zero documents/publications.
Clicked actual **Begin**. Current request **685bfcad-6dae-48e5-a6f5-bac1fa9e8005 RUNNING**.
Creative-agent session **36bc9a8a-ece9-4b51-988d-0bbce2bbfb2e**.
First completed op **dba7872c-baf3-4128-8ab9-00777374a2b1** verified GPT-6 Astra xhigh/all_turns and
matching mechanism receipt. First illustration op8b2bf0e1-c8d6-4ca0-8aa5-d7fa40d2067b completed17:44. Latest Astra op
**32e7bb12-ed42-4d99-936d-608f22094874**, created17:44:12UTC, received/in progress at last query. No fresh draft/publication yet. Query fresh; do not repeat Begin.

**Next:** let this fresh opening finish, verify its actual layout/controls, then use normal reader
continuation/exploration to prepare roughly50 reading screens with useful nesting. No further literary
analysis or auto-refinement by the development agent. Record measured scope, cost and final usable links.
Finish the live UI journey and final handoff; do not resume the superseded 30–50k development study.

CUA `tab` is **21**, browser1 (in-app), at
https://shape-of-time-production.up.railway.app/waiting/685bfcad-6dae-48e5-a6f5-bac1fa9e8005
Marked handoff this turn; mark again across turns, eventually deliverable. Old development tabs are gone.
CUA initialized; `tab` binding available. Use getAXState({emit:false}) and slice to avoid dumping the whole
book. Browser evaluate is read-only DOM; use actual UI controls for requests/navigation. AX click and
coordinate arrays are supported. No viewport override active.

## Budget — combined, do not reset

Original authorized provider allowance **$150 combined**, including text, imagery, criticism and renewal.
Development completed at **$94.697304** (unknown0), and its allowance was frozen at that committed spend.
Only **$55.302695** was allocated to the fresh reader edition; fraction of a cent left unallocated.
Receipt tests/receipts/edition-allocation.json and ignored .local/edition-allowance-2026-09-06.json.
Do not rerun freeze or restore a150 allowance on either edition. Current reader commitment **2.1961655**,
remaining **53.1065295**, unknown0; includes active reservation. Query fresh. Combined commitment is
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
