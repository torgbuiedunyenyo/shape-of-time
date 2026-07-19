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
    <source>This book's completed movements, in order</source>
    <document_content>
{{COMPLETED_MOVEMENTS}}
    </document_content>
  </document>

  <document>
    <source>The changed situation at the end of the last exposed folio</source>
    <document_content>
{{EXPOSED_TAIL}}
    </document_content>
  </document>
</documents>

{{TEMPORAL_RULES}}

<planning_request>
Plan the next finite movement of this book as one short natural-prose brief, in the manner of the
completed movement briefs above: what situation it opens from, what it follows, and what changed
situation ends it. A movement is finite — it must end at a real boundary, not a cliffhanger, and
it must not restart, summarize, or replay what has already been exposed.

{{PHASE_INSTRUCTION}}
</planning_request>

<output_format>
Return only a single XML element named movement_brief. Put the short natural-prose brief between
its opening <movement_brief> and closing </movement_brief> tags. Do not add analysis, headings,
lists, or commentary outside that element.
</output_format>
