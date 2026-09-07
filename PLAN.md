# Implementation plan

The product is a sustained illustrated novel containing potentially endless nested novels.
Development should serve compelling reading and continuity across those works. See [SPEC.md](SPEC.md)
for the experience and [EVALS.md](EVALS.md) for how to assess it.

## Architecture and responsibilities

1. **Creative context and tools.** Supply the original artistic sources, a persistent conversation,
   searchable published work, revisable documents, image creation and inspection, optional criticism,
   and publication tools. Keep choices of investigation, drafting and revision with the agent.
2. **Continuity over time.** Preserve full source and provider records, support working-context renewal,
   and keep fiction, drafts, beliefs and plans distinct. Link nested works to their actual origin.
3. **Text and images.** Let the agent direct illustrations using the same source context and visual
   references as the prose, and inspect results before deciding what to publish.
4. **Reading.** Present stable passages with comfortable typography and imagery. Support text and
   image exploration, arbitrary nesting, exact returns, bookmarks, search and browser-local resume.
5. **Preparation.** Offer useful reading-ahead opportunities while readers are present. Prioritize
   explicit requests and make first publications readable without waiting for a whole request to finish.
6. **Reliable operation.** Persist requests before execution, deduplicate repeated reader actions,
   preserve provider results before interpretation, and account for uncertain operations without
   blindly repeating purchases. Pin the creative mechanism and retain complete private draft archives.

These responsibilities are implemented in one TypeScript application with PostgreSQL and image
storage. Operational setup and commands are in [docs/development.md](docs/development.md).

## Development priorities

- **Reduce encountered waits.** Measure queue time, time to first readable passage and total request
  time separately. Assess whether preparation keeps useful material ahead of actual reading.
- **Validate long-form continuity.** Read sustained root and nested narratives through context renewal;
  examine consequences, character development and visual agreement using contextual criticism.
- **Refine the reading experience.** Exercise cold and prepared entry, deeper returns, reload, keyboard
  controls, small screens, text-size changes and guide demonstrations in the real interface.
- **Improve recovery evidence.** Verify that interrupted requests recover without duplicate purchases,
  published assets remain available, and corpus exports can be restored independently.

Use findings to guide changes. Do not substitute deterministic plot scaffolding or numerical literary
scores for the agent’s judgment and the author’s reading. Longer generation samples and paid reviews
require deliberate funding; they are not routine build tests.

## Change and release practice

For each change, identify the reader or creative need, implement the smallest coherent solution,
and verify the affected behavior. Mechanical tests should establish concrete properties; actual
reader walkthroughs establish whether interactions work in use. Neither alone proves literary success.

A new creative attempt starts empty, with its predecessor privately preserved and its new mechanism
recorded. Interface-only fixes do not require replacing fiction. Keep deployment revisions, private
spending allocations, temporary run counts and handoff notes in local operational records rather than
this public plan.
