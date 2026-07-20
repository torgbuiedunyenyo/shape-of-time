# C0 reader-first editorial run

Date: 2026-07-19 (America/Los_Angeles)

Status: **IN PROGRESS — 2/10 folios and 1/4 plates accepted.** This is bounded editorial
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

## Running spend and next operation

Two Fable calls have an aggregate usage-derived estimate of `$0.649270`. Known C0 text plus the two
completed Payment image outputs is `$0.762916`; provider billing was not separately queried.

`root-folio-03` (`The band`) is prepared, not dispatched, under request-manifest digest
`32465d99ec4aadacd9d22139aaf8308c55ba539364c67f60bd32fff572c98d48`. Its exact request contains
Payment prose, the actual accepted Payment PNG immediately after that prose, and The gift prose in
order. It calls for a new image direction and will use Payment as the sole narrative continuity
reference if the prose candidate passes editorial review.
