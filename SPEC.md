# Shape of Time — Product Specification

## Status and authority

This document is the product authority for the first illustrated **Shape of Time** hyperbook. It
defines the experience and the constraints that protect it. Implementation sequencing belongs
elsewhere.

## Product promise

> Read a beautiful illustrated novel. Turn the page to move through its story. Open a phrase to
> enter the finite illustrated book latent inside it. Return to the exact passage. Every book ends;
> the library does not.

Shape of Time is a calm, legible e-reader whose books form an explorable literary world. The reader
moves on two independent axes:

- **Page turn is narrative movement.** Each book follows a planned, finite arc one folio at a time.
- **An aperture is semantic movement.** A phrase, deliberate highlight, or explicitly requested
  title opens an adjacent finite book.

The reader does not choose a protagonist's action, converse with a bot, or wander through a
generated application. The text is both story and map, while the e-reader around it remains stable,
predictable, and quiet.

The anchor story is authored enough to mean something. Total emergence is not a virtue. Generation
elaborates a coherent world and finite narrative; it does not replace them with an ontology, a feed,
or an endless continuation prompt.

## Medium and scope

A **folio** is one composed reading surface and the unit of generation, readiness, and exposure. A
folio initially contains about 120–250 words and may be text-led, image-led, split, a plate, a map,
a document, or an artifact. Chapters and parts may organize the literature, but they never block
generation.

The initial garden contains:

- one root movement of approximately 14 folios, with its own satisfying emotional and causal shape;
- normally 10–12 root illustrations, with omissions or shared plates only when they improve rhythm;
- three prepared aperture books of 2–4 folios and 1–3 images each;
- a real ending for every book.

The first root movement draws from the beginning of Jay and Tan's story: their meeting, the
phone/payment incident, courtship, the first intelligible account of temporal movement, and an
honest decision or threshold. It must not compress the entire six-part novel merely to claim
completion.

The prepared books explore distinct parts of the same world:

- the 1989 earthquake as consumed by future tourism;
- Clef and the extraction/trade economy;
- temporal maps, visas, or the machinery of cross-era dependency.

They are small books, not encyclopedia entries. Their form may differ when that makes the subject
clearer or more pleasurable.

Each individual book is bounded. The library can grow without bound because any book may contain
further apertures.

## Canon

The factual and plot authority is the corrected, expanded Shape of Time world and complete six-part
Jay/Tan arc. Its source is:

- repository: `https://github.com/torgbuiedunyenyo/infinite-book`;
- commit: `1c3644b7d2e7c7b10a62cfa6c6f876ac53559836`;
- file: `world_document.md`;
- canonical body: line 19 through EOF (source line 373), excluding the editorial preamble;
- expected body SHA-256:
  `e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c`.

Reviewed in-repository canon must preserve the three temporal axes, the rule that one person exists
once while all times keep evolving, causal attenuation and self-healing, PRMTTs, temporal currents
and maps, time travel's political economy, Oakland, migration and visa systems, Clef, and the full
Jay/Tan arc.

The following retired ideas must not return through improvisation:

- a malevolent “dark thing” or supernatural edge anomaly;
- a disturbance that amplifies rather than self-heals;
- multiple scattered copies of a person;
- Jay as a quasi-mystical temporal sensor;
- an immutable fixed-2150 chronology.

World source, story bible, finite arc, folio beats, aperture plans, visual bible, and approved visual
anchors are human-reviewed authority. Open questions—especially Jay and Tan's appearance, Clef's
form, and recurring locations—must be resolved there. The first generated sentence or image does not
silently become canon. Undertow remains a possible sequel seed, not a seventh act appended to this
story.

## Text and image

Text and image share narrative labor.

- Prose carries action, causality, dialogue, thought, motivation, and orientation.
- Images carry place, material evidence, atmosphere, contradiction, relationship, spatial knowledge,
  or something deliberately left unspoken.
- An image must add narrative information. It must not merely decorate or paraphrase the prose.
- The form is an illustrated novel or artist's folio, not a conventional panel-by-panel graphic
  novel.

Visual continuity is intentional. Each image request identifies which references govern character
identity, appearance epoch, location, object, palette, medium, or composition; what must remain; what
must change; and what narrative job the new image performs. A normal plate uses the relevant
approved anchors plus the preceding or causal image. A repair between folios may use both neighbors.
Generated incidental details remain nonbinding unless deliberately promoted to an approved anchor.

## Writing

Canon documents are factual and plot reference, not style samples. The initial writer prompt is
light: write clear, absorbing narrative prose; favor scenes, actions, and specific details; use
concise orienting exposition when it helps; keep events, motives, and consequences legible.

There is no rigid “show, don't tell” rule. Characters may discuss the world when they have a reason
to, but they must not explain familiar facts to one another solely because a reader needs a lecture.
Legibility outranks withholding. The product must not impose a house style through generated
exemplars, recursive prose conditioning, pseudo-literary vocabulary, or an elaborate ban list.

One uninterrupted consecutive run establishes the baseline. Human readers—not a model's self-score—
decide whether they can state what happened, understand motives and causal changes, remain oriented,
and want to continue. Revisions address repeated, concrete failures with the smallest prompt or
planning change; prose is never assembled by cherry-picking lines from several runs.

## Reader contract

The e-reader shell, navigation grammar, typography, loading behavior, and persistence rules are
application code, never generated content.

A new reader can, without instructions or operator help:

1. Open a restrained library containing the anchor cover and discovered books.
2. Open a cover explicitly. A title page never flashes and auto-advances.
3. Read a composed folio and move with Next, Previous, keyboard arrows, or swipe.
4. Open a subtle suggested phrase and enter its prepared adjacent book immediately.
5. Choose **Back to passage** and return to the exact source book, folio, phrase, selection, and
   reading position.
6. Highlight arbitrary text, choose **Open as a book**, remain in place during an honest quiet
   creation state, and enter the finite child when it is ready.
7. Filter the shelf locally and instantly by title.
8. Deliberately choose **Create a book called …** when a title does not exist, confirm generation,
   and create a finite book. Merely typing in search never spends money.
9. Bookmark, leave, reload, and resume the exact book, folio, and position.
10. Reach a real ending and choose among return, shelf, and available apertures—not “write another
    chapter.”

Browser history, reload, keyboard, swipe, and responsive layouts must agree. Back is an exact return
operation, not a best-effort route to a book's beginning. Navigation must not create duplicate
history entries, dead ends, or title-page flicker.

Normal reading never displays token streaming. Preparation and caching make the expected path feel
immediate. A cold path leaves the reader in the book with a quiet, truthful state; it does not replace
the reader with a generic loading screen. Global generation banners, cross-book notices, unrelated
activity, auth walls, and silent spending do not belong in the reading experience.

The first reader is a deliberately pre-generated static garden. Its reading and exploration loop
must be delightful before dynamic generation is connected.

## Generation and continuity

### Text

Writing uses Claude Fable 5 with `xhigh` effort through a direct, verified Messages API contract:

- model: `claude-fable-5`;
- maximum output: 32,768 tokens;
- no Opus or other writer fallback, repair model, or silent provider substitution;
- no provider compaction, provider memory, or manual thinking-budget history;
- every request reproducible from application data.

The writer receives the corrected world, current book's finite arc, parent aperture where relevant,
all prior exposed current-book folios and narrative images while they fit, explicit current state and
unresolved threads with source IDs, and the current folio beat and intended change. The exact ordered
request manifest, prompt version, source and asset digests, token count, provider identity, usage,
latency, cost, and result are retained.

### Images

Images use the direct GPT Image 2 APIs, initially pinned to `gpt-image-2-2026-04-21`. Text-only
generation is for first canonical candidates; requests with continuity references use the Image
Edits API. Reference images and their order are explicit, persisted first-class inputs. Failed or
rejected outputs never become references.

Human review selects the visual direction and approves an 8–12-image continuity stress sequence.
Automated similarity may diagnose drift but cannot certify character, location, or narrative
continuity.

### Hard context boundary

The complete Fable request—including system text, prose, images, documents, and tool blocks—must
remain below 400,000 tokens:

```text
ABSOLUTE_CONTEXT_CEILING = 400_000
MAX_OUTPUT_TOKENS         = 32_768
SAFETY_MARGIN             = 4_096
MAX_COUNTED_INPUT         = 363_136
```

Before reserving spend or calling the writer, the application renders the exact request, counts that
request with the provider's token-count endpoint, persists the count and manifest digest, and admits
it only when the equation holds. Counting failure blocks generation. There is no character estimate,
silent truncation, cache-adjusted count, recent-page fallback, or image dropping.

The prototype uses full current-book text-and-image history and must remain far below the ceiling.
Long-form reconstruction must not activate during the initial garden.

If a real book later approaches the boundary, exact folios, images, plans, apertures, and human
decisions remain permanently stored and authoritative. A derived, rebuildable index may reconstruct
context from directly cited temporal, causal, episodic, and visual evidence in the same Postgres
database. No rolling summary, summary-of-summary, last-N window, provider-native compaction, vector
database, graph service, or memory microservice becomes canon. An old relevant cause must outrank a
recent irrelevant event.

## Exposure, identity, and spend

Every book has a finite plan and an opaque stable ID. Every folio has a unique `(book_id, ordinal)`.
Every aperture records the exact source folio and span and an opaque target book ID; titles are
display metadata, not identity.

A folio becomes **ready** only when its required prose, image assets, layout, apertures, and digests
exist and validate. Reader exposure is one atomic transition. After exposure, prose, layout, source
spans, and required asset IDs are immutable. Unseen candidates may be replaced; an exposed result may
not. A failed unseen folio may receive a linked retry.

Reservations and generation attempts use durable idempotency keys. Repeated clicks, retries, reloads,
or lease recovery must not duplicate a book, folio, or paid request. Every attempt records its exact
inputs, provider request ID, result, usage, latency, cost, and failure. Content becomes visible only
after the entire composed surface is ready.

## Architecture boundary

The prototype is one TypeScript package, one deployable Node process, one composition root, one
Postgres database, and one image bucket/CDN. The reader, HTTP server, domain, text and image adapters,
small durable generation loop, schema, and repositories live in that application.

The initial durable model needs only books, folios, apertures, assets, and generation attempts.
Bookmarks, discoveries, reading place, and local navigation history remain browser-local. A small
Postgres reservation/lease loop may perform generation work in process. There is no Redis, separate
worker, microservice graph, model committee, Turbo workspace graph, compatibility layer, account, or
authentication system.

EPUB may later be an export artifact. It is not the live storage model and must not distort the
reader architecture.

## Non-goals

The first product does not include:

- backward compatibility with the former application, schema, routes, corpus, summaries, embeddings,
  scores, title cache, or generated institutional furniture;
- accounts, social features, collaborative notes, or cross-device synchronization;
- image-region apertures or arbitrary image cropping;
- graphic-novel panels, speech balloons, or frame-perfect animation continuity;
- global title deduplication or an ontology of all possible books;
- public generation billing and quota UX;
- autonomous retcons or model-resolved canon conflicts;
- long-form retrieval machinery before a measured book needs it;
- an endless chapter frontier.

## Acceptance standard

The product is not successful because generation ran. It is successful when consecutive human
readers understand and enjoy the prose; images remain coherent and add meaning; page turn, phrase,
highlight, title creation, search, exact Back, bookmark/resume, keyboard, swipe, and responsive
layout feel like one dependable reader; ordinary movement is effectively immediate; cold creation is
honest; exposed work is immutable and idempotent; and someone wants to inhabit the page, turn it,
open something latent inside it, return, and do it again.
