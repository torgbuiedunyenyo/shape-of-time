<documents>
  <document>
    <source>Complete Shape of Time world and story</source>
    <document_content>
{{WORLD_DOCUMENT}}
    </document_content>
  </document>

  <document>
    <source>Current finite book brief</source>
    <document_content>
{{CURRENT_BOOK_BRIEF}}
    </document_content>
  </document>

  <document>
    <source>Parent aperture or founding passage</source>
    <document_content>
{{PARENT_APERTURE_OR_NONE}}
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

Treat the world document as factual and story authority, not as a voice to imitate. Keep the current
book's finite movement and the current folio's intended change in view. Aim for 120–250 words unless
the folio brief clearly requires a different rhythm.
</writing_request>

<output_format>
Return only a single XML element named folio_prose. Put ordinary prose paragraphs between its
opening <folio_prose> and closing </folio_prose> tags. Do not add analysis, planning, headings, a
continuity ledger, aperture metadata, or commentary outside that element.
</output_format>
