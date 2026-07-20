<documents>
  <document>
    <source>Shared world and canonical root story</source>
    <document_content>
{{WORLD_DOCUMENT}}
    </document_content>
  </document>

  <document>
    <source>Book origin and lineage</source>
    <document_content>
{{BOOK_ORIGIN}}
    </document_content>
  </document>

  <document>
    <source>Current finite movement</source>
    <document_content>
{{CURRENT_MOVEMENT_BRIEF}}
    </document_content>
  </document>

  <document>
    <source>Complete exposed story so far, including its narrative images in order</source>
    <document_content>
{{STORY_SO_FAR}}
    </document_content>
  </document>
</documents>

{{TEMPORAL_RULES}}

<current_folio>
{{CURRENT_FOLIO_BRIEF}}
</current_folio>

<writing_request>
Write one folio of clear, absorbing narrative prose. Continue from the actual events and emotional
conditions in the story so far. Favor scenes, actions, dialogue, thought, and specific material
details. Use concise orienting exposition when it helps the reader understand what happened, what a
person wants, or why something changed. Characters may discuss their world when they have a reason;
do not make them explain familiar facts solely for the reader.

<prose_guidance>
Good prose sounds like a person who knows exactly what they mean and says it once. Keep the reader
oriented to who is present, where they are, what they are doing, and what has changed. Use concrete
nouns, named things, unambiguous referents, and selected material details. Let the folio's
distinctiveness come from physical action, choice, speech, thought, or consequence, including a
character's particular way of noticing, rather than from decorated syntax.

Do not coin a capitalized or definite-article label for an ordinary feeling, relationship, problem,
event, or period merely to make it sound important. Established world terms remain valid, and a
genuinely new thing may earn a name through concrete use and context. Do not park an abstraction in
a spatial or bodily metaphor as a substitute for saying what happened. The narrator does not comment
on the prose, the folio, the scene, or what it supposedly reveals. Do not grade material as
remarkable or profound. State the material. Avoid balanced epigrams, thematic slogans, and other
manufactured profundity.

Prefer direct syntax to literary inversion or phrases that gesture at a thing instead of naming it.
Open on the actual situation, action, perception, or emotional fact underway, not a general claim
about life, time, or meaning. Each pronoun must have one unambiguous antecedent. Keep a chosen name
consistent across folios instead of cycling through synonyms, while revising distracting accidental
repetition within a sentence. Do not overload a sentence with several claims, force ideas into
groups of three, or compress them into noun piles. Keep quantities, quoted words, physical details,
motives, and consequences faithful to the story on the page.

Stay with the current folio's dramatic work. When less material is needed, choose fewer well-chosen
things rather than squeezing the same material into fragments. Cut filler, narrator hedging, and a
closing recap of what the reader just read. Do not use em dashes or en dashes in narration. An em
dash may mark speech that is genuinely interrupted.

Do not flatten the register. Plain is not bland, and direct prose can still be funny, tense, strange,
sensuous, or surprising. Preserve differences among character voices. This is not a rigid
show-don't-tell rule: concise exposition is welcome when it makes the world, motive, or causality
legible, and summary may carry time or connect scenes when that is the clearest choice.
</prose_guidance>

Treat the world document as factual and story authority, not as a voice to imitate.
Keep the current finite movement and the current folio's intended change in view.
The world document contains both shared world authority and the root Jay and Tan trajectory.
In a child book, the root trajectory is context, not a plot template.
Treat the child book's origin as its founding premise, not an instruction to continue the parent scene.
Follow this book's own movement, history, setting, cast, and dramatic center unless its movement brief
explicitly reconnects them to the root story.

When a movement has just ended, begin from its changed situation rather than replaying its tension.
Aim for 120–250 words unless the folio brief clearly requires a different rhythm.
</writing_request>

<output_format>
Return only one JSON object matching the supplied schema:

{
  "proseParagraphs": ["First ordinary prose paragraph.", "Second ordinary prose paragraph."],
  "imageDirection": null
}

proseParagraphs carries the folio's whole prose in one to three paragraphs, never more; a folio
that needs more paragraphs is a folio trying to be two folios.

For a text-led folio, imageDirection must be null. When the folio brief calls for a narrative image,
imageDirection must instead contain exactly these natural-language fields:

{
  "narrativeJob": "What narrative work the image performs.",
  "concreteScene": "What is physically present, where, and from what useful view.",
  "factLeftToImage": "The information the image supplies that the prose deliberately does not.",
  "mustRemain": ["Continuity that must remain from accepted prior prose or images."],
  "purposefulChanges": ["What is intentionally different in this moment."],
  "unresolvedFacts": ["Details that must stay open rather than being invented by the image model."]
}

The direction is narrative and observational. Do not name an image model, endpoint, quality,
resolution, reference asset, palette, or other application-controlled setting. Do not add analysis,
planning, headings, a continuity ledger, aperture metadata, or commentary outside the JSON object.
</output_format>
