# C0 reader-first editorial run

Date: 2026-07-19 (America/Los_Angeles)

Status: **IN PROGRESS — 5/10 folios and 2/4 plates accepted.** This is bounded editorial
authoring for the checked-in reader slice, not dynamic reader generation and not D0/D1 completion.

## Fixed contract and ceiling

- Writer: direct Anthropic Messages API, exact `claude-fable-5`, `xhigh`, no tools or fallback.
- Every operation sends the complete world, exact book origin and current movement, all accepted
  same-book prose and actual accepted narrative images interleaved in story order, temporal rules,
  current folio brief, prose guidance, and structured prose-plus-optional-image-direction output.
- Exact provider count precedes one inference dispatch; admitted input must remain at or below
  363,136 tokens with `max_tokens: 32768` and a 4,096-token margin.
- Ceiling: ten Fable operations, `$2.00` projected maximum each, `$20.00` aggregate.

## Accepted folio 1 — Payment

- Operation manifest: `1630c5df2f00914bcea58076859c66257cfa41ce3ca6a578de841b8480c590ec`
- Official input count: 13,112 tokens
- Result: 242 words plus one image direction; `end_turn`
- Candidate: `ed52dd2d072314454500515d20350561bf964fa212d3dc69f8ec50e702177986`
- Usage-derived text estimate: `$0.370920`
- Plate: accepted separately under the evidence recorded in
  `docs/qa/2026-07-19-c0-payment-plate-predispatch.md`

Editorial judgment: concrete and legible. Jay handles an ordinary shop payment failure; Tan's
embarrassment and suspicion are visible; the gift creates the page's causal change. Clef is realized
only for this root lineage as a cold bottle. The plate, rather than prose, carries the full shop
space, queue geometry, wear/refit, and unequal attention.

## Accepted folio 2 — The gift

- Operation manifest: `84a92169124e65c9080fc8c192fb04c96bd2a9359547ba2cee31429b72f0d899`
- Official input count: 15,545 tokens
- Provider message/request: `msg_011CdCRBgbHnNVhQojKaN23S` /
  `req_011CdCRBeCvaNrA5aAEvButp`
- Result: 253 words, `imageDirection: null`, `end_turn`
- Candidate: `fd9c0ab6d3acedb9abc9b596fcd9a3509f38b1cd41d5da2f351db2f19dc91d46`
- Recovered response latency: 40.135 seconds, measured from the durable dispatch timestamp to the
  completed response-file timestamp
- Usage-derived estimate: `$0.278350`

The provider result was complete and valid, but the original postflight rejected it at 253 words.
No redispatch occurred. The exact archived response was finalized through a one-time no-provider
recovery after the operational hard stop was corrected to 260 words while retaining 120–250 as the
prompt and layout target. The permanent runner now writes the complete provider-bound candidate
before applying the editorial length/layout check, so a valid paid result cannot disappear behind a
postflight editorial refusal. This avoids burning a second call for a three-word
overrun without admitting a materially long page. The provider output was not edited. The static
reader uses the same 260-word hard maximum; whether the 253-word result actually composes well at
desktop and mobile reading sizes remains a C0/C1 rendered-layout judgment, not a claim made here.

Editorial judgment: accept. Tan returns with a specific apology and cash; Jay preserves the first
bottle as a gift; they exchange names and choose to keep talking. The relocated bus shelter and
tour-coach bay make Oakland's visitor economy concrete without a lecture. The final question creates
forward motion. The title is direct, the referents are clear, and the page contains no temporal
cliché, invented thematic label, narrator self-grading, or pseudo-literary close.

## Accepted folio 3 — The band

- Fable operation manifest:
  `32465d99ec4aadacd9d22139aaf8308c55ba539364c67f60bd32fff572c98d48`
- Official input count: 16,108 tokens
- Provider message/request: `msg_011CdCSFkCp6QoR9TkmRubGQ` /
  `req_011CdCSFi3aiy9h2xS3JMknQ`
- Result: 234 words plus one image direction; `end_turn`
- Candidate: `07cf1a49a80a945d2c6e97ad1ed4ff255de214e68e67bad312da5bf96634d613`
- Message latency: 62.217 seconds
- Usage-derived text estimate: `$0.400230`

Editorial judgment: accept. Tan recognizes the next phrase of an uncredited Oakland recording; Jay
asks whether the musicians in front of them receive any of its revenue; Tan admits she never asked.
Their growing physical ease and pleasure in the set remain present, so the question does not flatten
the page into a lesson. The title is direct and the prose is concrete and causally legible.

The Band image used one exact Payment reference for Jay/Tan identity and the exposed root-book visual
world. Dry-run operation digest:
`cf492bb5edff409266b3d82c7ff94854d14230705bf2f5d6332a81b3e49640f1`;
manifest `8f4f045e5a6a7468455ab259127f757b7f077868deba92105cee5fab4585b34d`.
One GPT Image 2 dispatch completed under provider request
`req_72ab756044b34ffd94310b3b51bec1ad`, output
`93b388838c3dd73c94ce61658e4df8fc00eb1e166e8a425a5b3b65bdd7d2f2c4`, and a
`$0.056818` usage-derived estimate.

Reading-size review passed the single result. Jay and Tan remain recognizable in the same restrained
ink-and-transparent-color medium; their relationship has moved physically from counter separation
to ease in a crowd; the four-piece band is coherent; and an ordinary recorder at the room's edge
alone reveals the extraction withheld from the prose. There are no glowing effects, panels, captions,
or generic science-fiction cues. Acceptance digest:
`867bb9f056cf01fc30677d1d7f1ab0c772bb96de0cc1f9ec480ad12c4bf4ed92`.

## Accepted folio 4 — Your tomorrow or mine

- Fable operation manifest:
  `418a98198e7381479dec488a674bb31319b7bcf33d617100323e05b9d5884a7a`
- Official input count: 18,578 tokens
- Provider message/request: `msg_011CdCSkZTxAhyH7EfeEyJvY` /
  `req_011CdCSkWqCXwwu5hzGUs8Ss`
- Result: 260 words, `imageDirection: null`, `end_turn`
- Candidate: `8e1d7778cf20b440838ab19f2c01b6d7934b97be781796e577eae38dd61d9a99`
- Message latency: 42.176 seconds
- Usage-derived text estimate: `$0.318130`

Editorial judgment: accept. Jay and Tan admit how deliberately they have arranged their meetings,
kiss, and turn an ambiguous promise to return on Thursday into a specific Oakland date and two
different experienced durations. Travel remains bodily work rather than teleportation; both places
continue; the promise is practical and affectionate. The action, motives, referents, and causal
change are legible, and the folio does not introduce an invented thematic label or generic
time-travel paradox. The exact provider output ends with one surplus closing quotation mark. Preserve
that source evidence unchanged; remove only that mechanical mark when assembling the checked-in
reader fixture, and record the copy edit in production provenance rather than silently altering the
archived candidate.

## Accepted folio 5 — The venue

- Fable operation manifest:
  `d4243a8020de1ba51b3b5b208595f263279e457ecf1cf2098ecc0bed262c0917`
- Official input count: 19,142 tokens
- Provider message/request: `msg_011CdCTPE6AEMHtDsJUhs4Qy` /
  `req_011CdCTPBQRyHjhBb6uo1sct`
- Result: 247 words plus an unrequested image direction; `end_turn`
- Candidate: `92ac4f65ee2bb04f2a4bafdd91ff7299b7f5a7f0b32b48692acb46a1a61f4576`
- Message latency: 86.903 seconds
- Usage-derived text estimate: `$0.501970`

Editorial judgment: accept the prose and explicitly discard the image direction. Tan returns tired
on the promised date, brings Jay to a traveler venue, gains his entry with “He's with me,” and only
afterward understands that her defense still left his access and status in her hands. Their quiet
separation is concrete, specific, and causally earned. The prose is direct and legible, and it does
not turn the encounter into a lecture or slogan.

The structured provider result incorrectly supplied an image direction for this deliberately
text-led folio. It was preserved before the strict postflight refused the layout mismatch, and no
provider retry occurred. The prose and immutable provider record remain one unedited run. Acceptance
required the exact discarded-direction digest
`d6718038158319d2a4a881fccbbbd3acb45bf86d1d983df0af408becd2110cce`; accepted history exposes
the prose with no plate and no image direction. The normal postflight remains strict, so a future
format mismatch cannot be silently accepted.

## Running spend and next operation

Five Fable calls have an aggregate usage-derived estimate of `$1.869600`. Known C0 text plus the
three completed narrative-image outputs is `$2.040064`; provider billing was not separately queried.
Four of six image operations have been consumed: one credential rejection, one Payment visual
rejection, and two accepted plates. The two remaining operations are reserved exactly for the root
Map and Lagos terminal wall; no repair headroom remains.

`root-folio-06` (`After closing`) is prepared, not dispatched, under request-manifest digest
`acb26c64b3983173bee043ee99343e2cfe49f0f8aeec0897cd5ec0eba9d31008`. Its exact request interleaves
the five accepted prose folios and two accepted plates in story order. The discarded Venue image
direction is not exposed as story history.
