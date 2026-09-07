# The Shape of Time

*A love story.*

[Read the book](https://shape-of-time-production.up.railway.app/)

Jay and Tan live in a world where time works differently. Their story opens into other stories,
which open into others again: **an illustrated novel of potentially infinite novels within novels.**
A person mentioned in passing, a few selected words, an object on a counter, or a detail inside an
illustration can become the entrance to another book. That book can keep unfolding for as long as
you want to read it, and its own details can lead deeper still. You can always return to where you left.

These stories belong to the same world. An inset novel may reveal another life, another time or
another perspective, but it carries forward what the surrounding fiction has established. People,
places, events and their appearances are meant to remain consistent across prose, images and every
depth of nesting. Each story should also be worth reading in its own right, with desires, consequences
and a plot that develops. The ambition is an inexhaustible work of literature with the intimacy and
continuity of a novel.

Readers choose what catches their attention. They do not direct the plot or choose a character’s
next action. Highlight words, open an image, or draw a box around something inside it to follow an
opening; keep reading to remain with the story you are in.

## How the book is made

The human author supplies the world, artistic direction and judgment of whether the work succeeds.
A **creative agent**—a language model working over an ongoing conversation—develops the fiction.
The **harness** is the software around that conversation: it puts relevant material in front of the
agent, executes the tools it asks to use, returns their results, and preserves its work between visits.
It gives the agent a place to work and remember, rather than prescribing a sequence of writing stages.

For example, when a reader opens a detail in an illustration, the agent receives that source and
its surrounding story. It can retrieve the original worldbuilding, read earlier passages, look at
the actual illustration, or consult notes it previously saved. It can then draft the new work,
create an image using existing illustrations as visual references, inspect the result, revise, and
publish. It may investigate further or ask a separate critic for feedback. The choice and order of
those actions belong to the agent.

“Access” here means concrete tools, not a promise that every earlier page is always in the model’s
immediate context:

- **An archive it can search and read:** the author’s original world and writing guidance, published
  works and passages, image records, and saved documents.
- **A persistent workspace:** drafts and notes it can write and retrieve later. Plans and characters’
  beliefs remain distinct from events already established in the fiction.
- **Image tools:** generate illustrations, use prior images as references, and bring actual images
  into the conversation for inspection alongside the prose.
- **Publishing and linking tools:** establish a nested work, publish readable text-and-image passages,
  and offer openings tied to their source. The reading interface preserves the reader’s return path.
- **Optional criticism:** consult a separate agent that can examine the relevant writing and imagery,
  rather than judging only a summary of what was intended.

One active creative session moves among the connected works, so a nested story does not begin as
an unrelated generation with no knowledge of its origin. The conversation carries recent context;
stored notes and retrievable originals support longer continuity. When the working context needs
renewal, the original record remains preserved. This combination supports coherence as the book
grows; it does not guarantee that the model will never contradict itself. Coherence and literary
quality still need to be judged through actual reading.

The creative agent uses **GPT-6 Astra at medium reasoning effort**; illustrations use **GPT Image 2**.
Prompts encourage narrative movement, natural dialogue and agreement between images and prose.
There are no fixed plot beats, chapter lengths, image quotas or mandatory literary reviews. Storage,
request recovery and spending limits are handled by the surrounding software, leaving creative
choices to the agent.

## Reading and discovery

Published material is shared and immediately available. While someone reads, background preparation
lets the agent develop a continuation or nearby opening. If a reader reaches material that has not
yet been made, the existing page remains readable while they wait. Entry becomes available with the
first published passage, even if the agent is still developing more. Cold generation can take
several minutes; preparation helps but cannot hide every wait.

Reading places, bookmarks and opening history are saved separately in each browser profile.
There are currently no accounts or cross-device syncing; people sharing a browser profile also
share its reading history. A short, replayable guide demonstrates text and image selection.

## Background and documentation

This grows from the text-only [infinite-book](https://github.com/torgbuiedunyenyo/infinite-book),
extending its nested reading experience with imagery, a creative agent’s working memory, and more
freedom to investigate and develop the world. Original artistic material and its provenance are
preserved in [the source notes](content/shape-of-time/SOURCE.md). The retired folio prototype in
`archive/` is historical material, not the active architecture.

- [Specification](SPEC.md): the intended reading experience and creative principles.
- [Implementation plan](PLAN.md): the system’s responsibilities and development priorities.
- [Evaluation](EVALS.md): how mechanical reliability and literary quality are assessed.
- [Development guide](docs/development.md): setup, configuration, testing and operation.
