# Shape of Time source material

Updated September 6, 2026 following the user's correction: use the world content and writing guidance from infinite-book/main, preserve original wording, and allow some explanation of world mechanics without constant didactic monologues. The illustrated successor's later prose guide is superseded.

## Material for the new creative agent

Provide these files in full when starting the edition, alongside [visual-direction.md](visual-direction.md) and the small agent/tool orientation:

| File | Source and treatment |
|---|---|
| [world.md](world.md) | The full corrected historical worldbuilding document, including the original Jay/Tan trajectory. Exact source bytes, without editorial preamble. |
| [world-essence.md](world-essence.md) | WORLD_ESSENCE_BASE from the user-selected infinite-book/main templates.ts. Exact text, removing only its enclosing XML/TypeScript wrapper and adding a final newline. It retains the original time-trope distinctions and compact world descriptions. |
| [prose-guide.md](prose-guide.md) | Writing and inset guidance from that same main template. Most wording retained directly; the limited adaptations are listed below. |

Keep these originals available after context renewal. Include rich source prose rather than replacing it with a paraphrased story bible, mandatory fact schema, or another model's style manifesto. The overlapping descriptions can be read together; the full world supplies detail missing from the shorter prompt. The root trajectory is an artistic brief, not an instruction to assign its parts to page numbers. It describes intended development, not events that have already happened in every child.

The main template's Clef drink is available as the initial Oakland realization. The fuller document leaves Clef's exact nature open; do not generalize one local realization into a universal form for every place and work. Preserve the identity of a particular depicted object across passages and images.

Do not load the entire archived templates.ts as the agent's operating instructions. Its NARRATIVE_CONTEXT was an extraction-service prompt, not the generating model's system prompt; it also retains an approximate 2150 date and post-journey character assumptions inappropriate to an unstarted root. Use the corrected world's unspecified future era. Do not restore the earlier dark anomaly, multiplying selves or intuitive temporal sensing. The newer illustrated successor's prose guide, craft examples and rewritten temporal-rules prompt are not the sources for this replacement.

## Full world provenance

| Field | Value |
|---|---|
| Repository | https://github.com/torgbuiedunyenyo/infinite-book |
| Commit | 1c3644b7d2e7c7b10a62cfa6c6f876ac53559836 |
| Source path | world_document.md |
| Git blob | a78e83f9a13e81ad598b7c5cf3c4c8bfaef7993e |
| Extracted range | Line 19 through EOF |
| Extracted size | 4,512 words, 29,351 bytes |
| SHA-256 | e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c |

The 18 preceding lines are editorial discussion of correcting an earlier document. They remain preserved with the raw source. The body in world.md was already recovered before this turn and remains byte-identical; it has not been summarized or rewritten.

The full reference first appeared at c4f3d25, was removed at 0718ee4, restored at 97ccd3d, revised at af5ba8d and 1c3644b, then deleted at daad1778a3f47b329bba3496940d06436f885a66. The three distinct document versions are preserved under [the source archive](../../archive/infinite-book/README.md).

The last corrected body expands on PRMTT development and operation, cartography, company power, immigration, tourism, the unmapped edges, Jay, Tan, her father, the authorities, the plot, language drift and everyday life. The main template's WORLD_ESSENCE_BASE is 1,671 words including its two XML tags. The fuller reference is substantially richer background.

All 60 commits reachable from the freshly fetched refs were inventoried, across main and the experimental branches. No additional longer standalone worldbuilding prose document was found in those tracked paths. The corrected document mentions a separate “Document 1,” but that original was not found in this history. The existence of a condensed prompt is demonstrable; a context-window limit as the reason for condensation or deletion is not established by these commits. Local infinite-book-ref and infinite-book-research clones have the same reachable commit count/ref tips. /Users/ratpartyserver/git/world_document.md also matches the final historical blob.

## Main-template provenance and adaptations

Selected source: [templates.ts at main commit 72809379571e00f6115eab95dfc32efef8f54bc0](https://github.com/torgbuiedunyenyo/infinite-book/blob/72809379571e00f6115eab95dfc32efef8f54bc0/backend/src/prompts/templates.ts), blob c982d684438ed7b63ab4e5c52b26d90f2cb40c3d. The complete file is preserved exactly in the source archive, with checksums in manifest.json.

- WORLD_ESSENCE_BASE: source lines 101–240; content retained without paraphrase in world-essence.md.
- Writing principles and references: SYSTEM_PROMPT_SUFFIX, lines 360–401.
- Inset guidance: INSET_NARRATIVE_GUIDANCE, lines 82–93.
- Continuation and independent child-entry language: buildPrompt, lines 524–528.

The adapted prose guide retains distinct voices, subject-led exploration, source continuity, natural references and forward development. Changes are limited to:

1. Soften the absolute ban on explanation and naming mechanics in accordance with the user's latest preference. A character's practical explanation or brief narration may orient the reader. Keep trust and discovery; avoid recurring lectures.
2. Change per-page tension rules to sustained narrative guidance. Remove mandatory incomplete endings and prohibitions on reflection or resolving a conflict at a screen boundary. Pagination does not determine narrative structure.
3. Describe entering an inset without requiring the old double-bracket syntax. The new harness supports text and image exploration through tools.
4. Omit application instructions: fixed page ranges, 200–300-word outputs, reference quotas, arc-phase enforcement and extraction heuristics. Preserve the root's actual narrative wording in the full world.

These are design-specific adaptations of the requested source, not a new prose style. The original template remains available to inspect every change.

The user's exposition adjustment, verbatim:

> I personally really like sci-fi books where the background rules aren't explained at all, and you're just dropped in without explanation. However, I got some feedback on the text-only version that people wished they were told a bit more about what was going on. So we can soften that rule wrt the explainations of how time works in the world, world mechanics etc so long as it doesn't descend into constant "didactic monologues" and it trusts the reader to some extent to figure out what the rules are.

## Other historical material

archive/infinite-book/undertow-77e0c74.md.txt preserves the separate sequel seed from experimental templates.ts at 77e0c74d63c025f2567fcd1d374c284d5ae4e997, SHA-256 9dc8f105dac17a8a751a397026ff9b243d1de529633be1cc1431819e19c55dd3. It is not an automatic addition to the user-selected main source or a required continuation.

The previous version of this provenance document is preserved in the complete retired source snapshot at archive/folio-prototype-e1a3dec.tar.gz, path folio-prototype/content/shape-of-time/SOURCE.md, and in Git at e1a3dec. Its experimental-baseline and finite-movement instructions are historical only. PLAN.md remains the single implementation queue.

## Visual medium retained during repository cleanup

visual-direction.md preserves the approved inked-reportage medium in a small active document. Its core wording comes from the archived visual-bible.md's approved-medium paragraphs and visual-direction-candidates.md's selected Treatment B paragraph, both at e1a3dec. Only the medium and place-specific variety carry forward. The old visual bible's mandatory human approval of every reference/crop, fixed image-brief fields, compulsory eight-image sequence, restriction against giving the generating model visual direction, and rigid assignment of narrative jobs to prose versus pictures are superseded by the current agentic design. Those historical files remain complete inside the retired source snapshot. The new source document does not approve the comparison scene as a character, place or object reference.
