# Evaluating the illustrated world

Terms follow SPEC.md: the human creator is the author, the overall system is the book, people
exploring it are readers, and the generating model is the creative agent. Critic-agent assessments
and development-agent observations are evidence distinct from the author’s own reading.

This is the evaluation practice for the agentic replacement. Assess what the reader experiences and what the agent actually produced. Mechanical checks, provider contracts, artistic judgment and browser observations establish different things.

**Current scope, September 6:** the author asked to stop extended operator literary analysis and
automatic refinement after the mechanical work and initial coherence evidence. The development
study is preserved at its actual scope. Prepare roughly 50 reading screens in the fresh edition
for the author's own assessment; do not treat the longer study below as an outstanding release
requirement. The creative agent retains its ordinary option to seek criticism as it develops work.

## Literary and visual judgment

Use GPT-6 Astra at xhigh as the initial LLM critic, in a context separate from the creative agent's running conversation. Supply the intended experience, the original infinite-book material and adapted prose-guide.md identified by content/shape-of-time/SOURCE.md, the actual material under review and read-only access to relevant original prose/images. The later illustrated-successor prose guide is superseded. Do not give the critic only summaries, intended image prompts or the creative agent's claims about why the draft succeeds.

The critic can investigate. It should explain its conclusions with specific passages, images and source references, distinguish a real contradiction from viewpoint or uncertainty, and say when the available evidence is inadequate. It may request broader context before judging a long-range relationship. Do not impose a maximum source window that prevents the judgment being asked for.

Ask questions appropriate to the reading:

- What makes this stretch absorbing or uninteresting? Where did attention weaken, and what in the work explains that?
- Can the reader follow enough of the world's mechanics to understand the experience while retaining discovery? Distinguish intriguing uncertainty from preventable confusion, and useful explanation from repetitive didactic monologues. Naming or briefly explaining a mechanic is not inherently a flaw.
- Do characters retain particular wants, habits and incomplete understanding while developing through experience?
- Do scenes accumulate consequences and create worthwhile continuation, including after a resolution?
- Does a child grow meaningfully from its origin and sustain a life of its own?
- Do prose and images agree where they concern the same thing? Are changes motivated, ambiguous, or erroneous?
- Does looking contribute something worthwhile, including place, intimacy or atmosphere as well as information?
- Does a return to earlier work deepen the reading without rewriting its established material?

These are questions for judgment, not fields every scene must satisfy. A quiet scene, a character's lie, an unfulfilled possibility or an illustration without a new plot clue can be successful. Do not require exposition at a fixed interval or reward explanations merely for existing; assess their contribution in the sustained reading.

A useful review contains a concise assessment, grounded examples of strengths and failures, the additional sources consulted, uncertainty and a few consequential suggestions. It may recommend continuing, revising, or collecting more evidence. Do not replace this with an average score, a mandatory checklist, a numerical threshold or a committee vote.

## Critic calibration and comparisons

Use a small set of preserved predecessor cases to check whether the critic can distinguish quality and inconsistency:

1. The long-gap return of Jay's private amber, with the establishing and returning passages.
2. The first Clef giver reversal, including the original giving scene and the later contradictory statement.
3. Mrs. Chen's repeated first departure, with the earlier departure available.
4. Distinct Clef realizations in different predecessor editions, labeled as different editions rather than presented as a within-book contradiction.
5. The different post-resolution behavior in main and experiment-past-ending, with enough surrounding prose to assess development rather than isolated language.

Preserve exact source provenance. Do not tell the critic the expected diagnosis before its initial reading; compare its explanation afterward. A miss prompts investigation of context and judgment, not a regex that manufactures a pass. This is a modest calibration exercise that can accompany the first live work, not a new project blocking it.

Keep complete experimental runs, including rejected drafts and images. Report revisions made before publication and any manual intervention. Do not splice the best paragraphs from several runs and present them as one autonomous result.

The predecessor is an experiential comparison, not a controlled test of architecture: its generating model and other conditions differ. For comparisons among new variants, keep Astra/xhigh, GPT Image 2 and authored source/guide fixed where possible. Conceal variant/model labels from reviewers when useful. The author's reading and preferences remain part of artistic direction.

## Progressive reading evidence

**First illustrated sequence:** read consecutive actual output in the reading interface and inspect the paired images. Confirm the agent could see its own returned images, act on tool results and use criticism. This establishes the live creative loop, not long-form quality.

**Nested journey:** follow an actual generated source into a child, then a source in that child into a grandchild; return and continue. Read the source and child together, then read enough of the child to assess independent development. Do not supply the nested premises in advance.

**Substantial connected corpus:** extend the same root and nested works across many scenes. The plan suggests 30,000–50,000 words as an initial study scale, followed by a novel-length root and continuation. Corpus size is context for the claim, not a pass threshold.

**Context renewal:** resume after an explicit checkpoint/compaction using persistent notes and archive access. Assess what was remembered, retrieved, misunderstood or lost. Include actual prose/images across the boundary.

**After resolution:** assess whether a new situation grows from what has happened, rather than continued repetition of closure or arbitrary undoing of the ending.

For long-form judgment, supply the complete available reading sequence when practical and allow source retrieval. Long-range claims need distant source evidence; reviewing isolated short windows cannot establish them. Record what the author, critic and builder actually read, separately.

## Mechanical checks

The minimum useful regression suite covers:

- saving and reading a composition without fixed word/paragraph limits;
- stable publication and asset addresses, including duplicate submissions;
- prevention of partial publication when an image is unavailable;
- preservation of provider outputs before parsing and recovery after restart;
- resumption from saved tool results without repeating completed effects;
- no automatic replay of a provider request with an uncertain outcome;
- enforcement of the shared spending allowance, including critique;
- exact text and image anchors after reflow;
- root → child → grandchild → child → root after reload and mixed page turns;
- a shared work entered from two origins returning correctly in both cases;
- warm/cold opening behavior, no focus stealing, and no generation from read-only search;
- correct selected model/effort and actual image-bearing tool results on live contracts.

Use real Postgres and storage for stateful tests. A small known fixture may test a reader control. Recorded real provider receipts may test protocol replay. Neither is described as a fresh generation or literary pass.

Ordinary CI is free of paid inference. Run funded live-provider/evaluation commands explicitly with the run configuration, allowance and artifact destination. Tests may deterministically validate literal addresses and resource arithmetic; they must not certify meaning through phrase presence, word counts, plot counters or similarity scores.

## Reader walkthrough

Use the in-app Browser for the actual experience, with desktop and narrow layouts. Read, change text size, inspect images, turn pages, enter a prepared work, create a cold opening, explore image/text sources, return through multiple levels, visit the shelf, reload and resume.

Record usable screenshots or a short recording where they support an appearance/navigation claim. Exercise visible controls; DOM presence alone is not enough. Automated browser regressions supplement this walkthrough.

Measure warm navigation, cold opening time, frontier wait, wasted preparation and actual cost. Report the observed distribution/sample size instead of a universal latency promise.

## Evaluation record and completion

Each report identifies the code revision, prompt/source versions, edition/publications, selected and returned model evidence, evaluation scope, actual readers, source material inspected, provider usage, estimated/uncertain costs, failures and conclusions. Keep machine receipts/corpus exports outside Git when large; commit a small report and manifest with retrievable locations.

Report these separately:

1. Mechanical behavior: passed/failed/not run, with concrete checks.
2. Provider behavior: verified/failed/uncertain, with real receipts.
3. Literary and visual assessment: grounded judgment and unresolved questions.
4. Reader experience: observed journey and usability failures.

A milestone may be mechanically functional but artistically unpromising. Fix the cause before increasing spend; do not relabel a short demonstration as long-form success. Publication is the creative agent's decision within the harness. Development evaluation is how we judge and improve the harness, not an obligatory permission gate on every page.
