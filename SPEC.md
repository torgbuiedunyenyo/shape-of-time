# Shape of Time product specification

Current direction: September 6, 2026. This replaces the July fixed-folio prototype specification. Implementation details and milestones are in PLAN.md; actual progress is in HANDOFF.md.

## Intended experience

Read an absorbing illustrated narrative. Follow a passage or image into another narrative that has its own life. Return to the exact place with a deeper understanding. Continue in either direction through a coherent, expanding literary world.

The containing reader is calm and dependable. Books can unfold at length and contain other books, records, images, places and people worth exploring. Nested works should reward sustained reading rather than merely explain selected nouns.

The source of new work is an agent that can decide what to investigate, create, revisit and develop, supported by persistent context and memory. Generative autopoiesis means that created works become fertile material for further works. It does not require a formal calculus of obligations or a fixed self-modification mechanism.

## What carries forward

The text-only infinite-book was a success and is the comparison to preserve and surpass. The failed illustrated successor's architecture and corpus are not compatibility targets.

The full corrected world in content/shape-of-time/world.md remains the shared source and the original Jay/Tan trajectory remains the initial root creative brief. Its source is infinite-book commit 1c3644b7d2e7c7b10a62cfa6c6f876ac53559836, world_document.md line 19 through EOF. Expected body SHA-256: e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c.

Preserve its three temporal axes, single existence of a person, evolving times, attenuating/self-healing causation and the particular political/material world. Do not restore the retired dark anomaly, duplicate selves, mystical sensing or fixed-2150 chronology. Undertow is a separate optional historical seed, not a required seventh act.

Use the writing guidance and world content from infinite-book/main's backend/src/prompts/templates.ts, as the user now explicitly requests. The illustrated successor's later prose guide is superseded. content/shape-of-time/SOURCE.md records exact provenance and limited adaptations; world-essence.md preserves the main template's world text and prose-guide.md retains its writing/independence guidance with the changes needed for this design. Supply these alongside the full 4,512-word world.md, preserving original wording instead of replacing it with another summary or style manifesto.

Trust the reader to enter an unfamiliar world and infer some of its rules, while allowing a bit more explanation of time and world mechanics when it helps them follow what is happening. Brief narration, practical conversation and ordinary observation can orient without constant didactic monologues. Naming a temporal axis is not itself a writing failure. Do not impose an explanation quota or require every scene to teach a rule.

The approved ink-and-color medium remains the initial visual direction. It does not mandate identical portraits, palettes or picture density.

The full source is available to the agent. Its world and root trajectory are context for creating the work, not a chapter/page scheduler. Characters may misunderstand one another and make poor decisions coherently.

## Models

Use GPT-6 Astra at xhigh for the creative agent and prose. The initial LLM critic also uses Astra at xhigh in a separate context. Use GPT Image 2 for imagery. Exact verified API choices are in PLAN.md. Do not silently fall back to Opus/Fable, a different model or a lower effort.

Astra can choose visual references, direct creation, examine returned images and revise unpublished work. The application executes and preserves tool results. It does not predetermine the order of writing, imagery, planning and criticism.

## Creative environment

The agent has a persistent workspace for ordinary drafts, observations, plans and references in forms useful to it. It can access the real published prose and images, their origins and relevant related works. Notes help recall and navigation; they do not replace the originals or become an infallible fact catalog.

Plans remain revisable. Published prose/images remain the record readers can encounter. A character's belief is not automatically world truth, and a fictional document's contents are not automatically history. The agent uses context and judgment to make those distinctions.

A particular returning person, object or event should remain consistent across works that actually concern it. Different local cultures, interpretations or open concepts need not be normalized into one global realization. Reader knowledge does not become character knowledge merely because a child has been read.

Begin with one active creative agent for the connected edition. It can shift among works, retain longer intentions and seek criticism. This is an initial implementation choice, not a permanent limitation or a mandatory committee.

## Text and imagery

Both media participate from the first live experiment. An image may contribute place, intimacy, atmosphere, material evidence, spatial understanding or narrative revelation. It need not contain a required hidden fact.

Allow text-led stretches, full images and interleaved compositions. A scene may cross many screens; a short image-led moment may occupy one. Images can originate ideas as well as respond to prose. The agent can revisit a real image detail and let that observation affect later work.

Keep actual returned images and the references used to create them. A prompt's intention is not proof of what the image shows. Relevant references can come from another work when they depict the same thing. There is no fixed last-five-images selection policy or universal portrait rule.

## Reader behavior

The reader presents stable compositions with comfortable typography, image sizing and text-size controls. Pagination adapts to the display; it does not impose story length, paragraph limits or dramatic beats. Familiar forward/back navigation continues within the work without false ending screens.

A few prepared openings invite exploration. Arbitrary text selection, whole-image entry and then image-region entry use the same Open as a book grammar. An optional angle can guide the exploration, but readers need not write a synopsis. Explicit title creation remains available separately from read-only shelf search.

Entering a prepared work is immediate. A cold opening keeps the originating material readable with truthful local status. If the reader goes elsewhere, a completed opening is retained without interrupting them. Generation errors do not masquerade as fictional closure.

The reader's visit trail is separate from work identity and fictional relationships. Preserve exact return through root, child, grandchild and further nesting, including after page turns, reload, shelf visits or reflow. A work entered through two different sources has two different return routes. Save bookmarks, discoveries and current place.

Normal reading shows stable published material, not token streaming or agent diagnostics. Agent work and operation details are available to the operator outside the reading surface.

## Reliability and scope

Preserve returned work before validating or publishing it. Published compositions refer only to available stored assets and retain stable addresses. Drafts are freely revisable; published corrections preserve prior versions.

One small application, Postgres and image storage are sufficient initially. Reuse useful mechanical pieces, replace the old folio/movement orchestration and keep historical evidence separate. No backward compatibility with the failed successor is required.

Bound provider spending, retain uncertainty about ambiguous calls and recover interrupted work. These are mechanical responsibilities. They do not justify deterministic judgments of narrative meaning.

## How success is established

Use contextual LLM-as-judge, informed by actual sustained reading. Judges can inspect the work, request relevant history/images and explain their judgments. The agent can use criticism to improve its drafts without mandatory per-page approval.

Observe a genuinely generated illustrated root, child, grandchild, exact return and coherent continuation. Extend the same corpus into long-form development and through context renewal. A beautiful opening, a static demo or green mechanical tests cannot alone establish that experience. EVALS.md defines the evidence practice.
