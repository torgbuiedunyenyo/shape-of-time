# Shape of Time product specification

Current direction: September 7, 2026. This replaces the July fixed-folio prototype specification. Implementation details and milestones are in PLAN.md; actual progress is in HANDOFF.md.

## Terms

- **Author:** the human creator of the book: the user directing this project. The author supplies its world, artistic intent and guidance, and assesses its development.
- **Book:** the overall system and generative work, The Shape of Time, encompassing the world, its narratives, images and exploration experience.
- **Reader:** a person exploring the book. A reader can continue a narrative or open a nested narrative from encountered material.
- **Creative agent:** the model operating inside the book to investigate, generate, revisit and develop text and imagery using persistent context and tools. It is not called the author.
- **Critic agent:** the model providing contextual criticism. Its review is distinct from the author's judgment and readers' experiences.
- **Reading interface:** the UI through which readers encounter the book. Use this term rather than calling the software itself a reader.
- **Work or nested narrative:** an individual narrative within the book. A nested narrative may itself contain further narratives. The database name `work` does not denote a separate overall system.

A **reader continuation request** asks for more of the current narrative. One request may involve
many creative-agent turns and publish material spanning several reading screens. Requests, agent
turns and screens are different units; do not use them interchangeably.

## Intended experience

Read an absorbing illustrated narrative. Follow a passage or image into another narrative that has its own life. Return to the exact place with a deeper understanding. Continue in either direction through a coherent, expanding literary world.

The reading interface is calm and dependable. Its narratives can unfold at length and contain nested narratives, records, images, places and people worth exploring. Nested works should reward sustained reading rather than merely explain selected nouns.

The author intends a novel with inset novels with inset novels. Each work needs a life that develops,
with reasons to care about what happens and intimations that can bear fruit later. Prompt context
encourages scene selection, foreshadowing and narrative movement; the creative agent chooses their
particular form. No plot template, beat schedule or deterministic literary check enforces them.

The book is implemented as a world exploration harness. Its creative agent can decide what to investigate, create, revisit and develop, supported by persistent context and memory. Generative autopoiesis means that created works become fertile material for further works. It does not require a formal calculus of obligations or a fixed self-modification mechanism.

## What carries forward

The text-only infinite-book was a success and is the comparison to preserve and surpass. The failed illustrated successor's architecture and corpus are not compatibility targets.

The full corrected world in content/shape-of-time/world.md remains the shared source and the original Jay/Tan trajectory remains the initial root creative brief. Its source is infinite-book commit 1c3644b7d2e7c7b10a62cfa6c6f876ac53559836, world_document.md line 19 through EOF. Expected body SHA-256: e47afa2fc5db4350008f65fcea9bf6b32569e79a6ee4aeb212e066ddd139576c.

Preserve its three temporal axes, single existence of a person, evolving times, attenuating/self-healing causation and the particular political/material world. Do not restore the retired dark anomaly, duplicate selves, mystical sensing or fixed-2150 chronology. Undertow is a separate optional historical seed, not a required seventh act.

Use the writing guidance and world content from infinite-book/main's backend/src/prompts/templates.ts, as the user now explicitly requests. The illustrated successor's later prose guide is superseded. content/shape-of-time/SOURCE.md records exact provenance and limited adaptations; world-essence.md preserves the main template's world text and prose-guide.md retains its writing/independence guidance with the changes needed for this design. Supply these alongside the full 4,512-word world.md, preserving original wording instead of replacing it with another summary or style manifesto.

Trust the reader to enter an unfamiliar world and infer some of its rules, while allowing a bit more explanation of time and world mechanics when it helps them follow what is happening. Brief narration, practical conversation and ordinary observation can orient without constant didactic monologues. Naming a temporal axis is not itself a writing failure. Do not impose an explanation quota or require every scene to teach a rule.

The approved ink-and-color medium remains the initial visual direction. It does not mandate identical portraits, palettes or picture density.

The full source is available to the agent. Its world and root trajectory are context for creating the work, not a chapter/page scheduler. Characters may misunderstand one another and make poor decisions coherently.

## Models

Use GPT-6 Astra at medium for the creative agent and prose. The initial LLM critic also uses Astra at medium in a separate context. Use GPT Image 2 for imagery. Exact verified API choices are in PLAN.md. Do not silently fall back to Opus/Fable, a different model or a lower effort.

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

The reading interface presents stable compositions with comfortable typography, image sizing and text-size controls. Pagination adapts to the display; it does not impose story length, paragraph limits or dramatic beats. Familiar forward/back navigation continues within the work without false ending screens.

A few prepared openings invite exploration. Arbitrary text selection, whole-image entry and then image-region entry use the same Open as a book grammar. Readers choose what to explore; they do not supply narrative directions, premises or titles. The reading interface offers no freeform generation controls. Shelf search only searches existing works. The author's artistic direction remains distinct from reader exploration.

Entering a prepared work is immediate. A cold opening keeps the originating material readable with truthful local status, distinguishing waiting to begin from active generation. Entry becomes available as soon as the first published section is readable, even while the creative agent continues working. No request-completion or multi-section threshold delays it. If the reader goes elsewhere, the opening is retained without interrupting them. Generation errors do not masquerade as fictional closure.

The reader's visit trail is separate from work identity and fictional relationships. Preserve exact return through root, child, grandchild and further nesting, including after page turns, reload, shelf visits or reflow. A work entered through two different sources has two different return routes. Save bookmarks, discoveries and current place.

Normal reading shows stable published material, not token streaming or agent diagnostics. Agent work and operation details are available to the operator outside the reading surface.

## Reliability and scope

Preserve returned work before validating or publishing it. Published compositions refer only to available stored assets and retain stable addresses. Drafts are freely revisable; published corrections preserve prior versions.

One small application, Postgres and image storage are sufficient initially. Reuse useful mechanical pieces, replace the old folio/movement orchestration and keep historical evidence separate. No backward compatibility with the failed successor is required.

Bound provider spending, retain uncertainty about ambiguous calls and recover interrupted work. These are mechanical responsibilities. They do not justify deterministic judgments of narrative meaning.

## Development evidence and the reader edition

Development stories, rejected work, reviews and interventions are private engineering evidence.
Preserve their relationship to the actual source, prompts, tools, memory behavior and deployed
mechanism versions so later changes can be assessed through their story effects. They must never
be copied into the final reader edition or its creative agent context.

The final edition begins under one pinned creative process. All its text and images grow from that
process. A materially changed generation mechanism warrants a fresh edition; ordinary reading-interface
refinements do not. Preserve the development archive when replacing the corpus presented to readers. Pinning is
provenance and release discipline, not a prescribed story or a constraint on the creative agent’s choices.

## How success is established

Use contextual LLM-as-judge, informed by actual sustained reading. Judges can inspect the work, request relevant history/images and explain their judgments. The agent can use criticism to improve its drafts without mandatory per-page approval.

Observe a genuinely generated illustrated root, child, grandchild, exact return and coherent continuation. Extend the same corpus into long-form development and through context renewal. A beautiful opening, a static demo or green mechanical tests cannot alone establish that experience. EVALS.md defines the evidence practice.

## Reading interface and preparation buffer

The cover presents the title, “A love story.” and an illustration from the book. Reader-facing
copy serves the fiction; explanations of the medium belong only where needed to use controls or
understand generation waits. The optional guide visibly demonstrates selecting words and drawing
an image region, without submitting requests or changing the narrative.

Published works are shared; reading positions, bookmarks, guide dismissal and saved opening history
are private to a browser profile. This implementation has no reader accounts or cross-device sync.
Do not describe its local persistence as authenticated per-person storage.

Ahead-of-reader expansion uses the ordinary reader request mechanism and the same creative context.
The requested 40-step buffer means 20 additional core continuations and 20 additional side-story
requests on reachable paths. It is currently paused by the author; resumption requires a new instruction.
The September 7 xhigh-to-medium transition was an explicit one-time exception to the fresh-attempt
rule. Earlier material and its original provenance remain intact.
