# C0 reader-first editorial run

Date: 2026-07-19 (America/Los_Angeles)

Status: **IN PROGRESS — 9/10 folios and 3/4 plates accepted.** This is bounded editorial
authoring for the checked-in reader slice, not dynamic reader generation and not D0/D1 completion.

## Fixed contract and ceiling

- Writer: direct Anthropic Messages API, exact `claude-fable-5`, `xhigh`, no tools or fallback.
- Every operation sends the complete world, exact book origin and current movement, all accepted
  same-book prose and actual accepted narrative images interleaved in story order, temporal rules,
  current folio brief, prose guidance, and structured prose-plus-optional-image-direction output.
- Exact provider count precedes one inference dispatch; admitted input must remain at or below
  363,136 tokens with `max_tokens: 32768` and a 4,096-token margin.
- Ceiling: eleven Fable operations, `$2.00` projected maximum each, `$22.00` aggregate. The eleventh
  operation is one explicit linked replacement for the retained, structurally empty Map result
  described below; it is not an automatic retry or a general repair pool.

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
recovery after the operational hard stop was first corrected to 260 words while retaining 120–250 as the
prompt and layout target. The permanent runner now writes the complete provider-bound candidate
before applying the editorial length/layout check, so a valid paid result cannot disappear behind a
postflight editorial refusal. This avoids burning a second call for a three-word
overrun without admitting a materially long page. The provider output was not edited. The later
262-word child result clarified that this is an immutable-provider preservation boundary, now 265,
not the desired reader length. Final page copyedits still aim at the 120–250 target, and composition
at desktop and mobile reading sizes remains a C0/C1 rendered-layout judgment.

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

## Accepted folio 6 — After closing

- Fable operation manifest:
  `acb26c64b3983173bee043ee99343e2cfe49f0f8aeec0897cd5ec0eba9d31008`
- Official input count: 19,633 tokens
- Provider message/request: `msg_011CdCU6ynMvV5vWthkCmLU4` /
  `req_011CdCU6sx8A5z1QuHcvY2Dw`
- Result: 254 words plus an unrequested image direction; `end_turn`
- Candidate: `e1887b6f0d1986df1a520f1f8541698032fd6530400a2df17045c21227cbce5d`
- Message latency: 84.439 seconds
- Usage-derived text estimate: `$0.504830`

Editorial judgment: accept the prose and explicitly discard the image direction. Tan apologizes
without asking Jay to erase the Venue encounter; the leaking cold case gives them ordinary work in
which disagreement, competence, and laughter repair the courtship. Her invitation is plain, and
Jay's sponsorship, bodily-travel, and return questions turn it into a threshold that requires facts.
The page is concrete, emotionally legible, and still leaves the next choice genuinely unresolved.

Fable again returned an image direction even though the prose contract required `null`. The exact
candidate remains unchanged; no retry or image call occurred. Acceptance required discarded-direction
digest `45b1a6f669583787f1cc7281c513cfbe88acbec7357b04721cf5d5cc0f4c01c7` and exposes only the prose.
Because this was the second consecutive mismatch, the mechanical cause was fixed before preparing
the next operation: the provider schema now makes `imageDirection` structurally `null` for text-led
folios and structurally an object for illustrated folios, rather than presenting both allowed branches
and relying on a prose instruction.

## Rejected folio 7 operation — The map

- Fable operation manifest:
  `2643558816187ff44b52e350469d4854010dc51dae167d2ae12d638ff72ee32e`
- Official input count: 20,215 tokens
- Provider message/request: `msg_011CdCUdprCqKzcihNV1nxct` /
  `req_011CdCUdQVji89zcBA555SVk`
- Result: `end_turn`, but `proseParagraphs: []` and every required image-direction string empty
- Usage-derived text estimate: `$0.540050`

This completed provider response is retained and must not be redispatched. It produced no usable
prose or image direction, so no candidate could be accepted or recovered. The provider-supported
schema subset does not enforce `minLength`, `minItems`, or related constraints;
[Anthropic's current structured-output guidance](https://platform.claude.com/docs/en/build-with-claude/structured-outputs)
instead recommends adding those requirements to field descriptions and validating the original
constraints after receipt. The direct adapter already performed the latter.
The raw supported schema now also tells Fable explicitly that prose paragraphs and direction fields
must be non-empty.

A red-first replacement path permits exactly one separate claim only after it verifies the original
fixed claim, HTTP 200 provider response, exact rejected manifest, absent candidate, and the named
structural failure. The normal claim still prevents a duplicate; a second replacement cannot be
claimed. This evidence justifies increasing the editorial ceiling by one operation before spend.

## Accepted folio 7 — The map

- Replacement Fable operation manifest:
  `2614136ef68b29404108250956f6f012a5f21ec782b8b28829f8040b88eaba3f`
- Replaced rejected manifest:
  `2643558816187ff44b52e350469d4854010dc51dae167d2ae12d638ff72ee32e`
- Official input count: 20,421 tokens
- Provider message/request: `msg_011CdCVdwLkQGyw3dzeeo2t4` /
  `req_011CdCVdtkUVeinCMoSU1xeU`
- Result: 258 words plus a complete image direction; `end_turn`
- Candidate: `d836a8a326c6dc969a3ff3da5bb2508796def4b487a8cc5445bbff17904acb91`
- Message latency: 129.611 seconds
- Usage-derived text estimate: `$0.777110`

The replacement preserved the exact content manifest, six-folio/two-plate history, current beat,
model, effort, and output cap. Only eight supported schema descriptions changed. An independent
predispatch audit verified both the retained structural failure and the single linked replacement
boundary. The new prose is concrete and causally clear: Tan returns with a physical three-axis
route; Jay asks about bodily duration, ownership, and failure; he keeps the chart to study rather
than agreeing prematurely. The 258 words are within the 260-word hard ceiling. Production fixture
provenance must record the single punctuation copyedit from “What does it feel like.” to “What does
it feel like?”

The exact Map plate dry run bound Payment and Band, in that order, as the only continuity references;
Fable's direction was unchanged. It dispatched once under:

- operation digest:
  `6c52e6b547079ff63539b45f09afcfb7ced66f4c3aa29fb7c1d4a43a81bf469a`
- requested snapshot: `gpt-image-2-2026-04-21`
- provider request: `req_320682b846354a01be9014c9f3836739`
- output digest: `f6bd9bbbb3fb66e4f6442e19f52c723135c0bd8bec5f07ed4f2b4b2a7aafa82a`
- dimensions/format: 1024×1536 opaque PNG
- usage-derived estimate: `$0.069541`
- acceptance digest:
  `61341b2b9ca235e823fb36a15ce13e22af7578fce7f13d411490100af94d0d50`

Original-size and 520-pixel reading-size reviews both passed. The plate preserves Jay and Tan, uses a
new over-shoulder back-room composition, and makes the physical chart's official print, traded pencil
observations, revision marks, route, and uncertain regions readable as categories without readable
invented text. No generic future interface, portal, new lore, or reference composition was copied.

## Accepted folio 8 — Jay says yes

- Fable operation manifest:
  `b1d83860e4d6c5ef72d0ff5ab4b89b78424bded560ab67343767c1d0017484a1`
- Official input count: 22,538 tokens
- Provider message/request: `msg_011CdCWXMdfcp95mtVhSysJQ` /
  `req_011CdCWXDfBxnwoJ1HwASS8k`
- Result: 253 words; `imageDirection: null`; `end_turn`
- Candidate: `54b8e91f050f5fc173192ed9352aa4f91c9e9ab2276e4fed8b57c307cb087087`
- Message latency: 68.835 seconds
- Usage-derived text estimate: `$0.491330`

The exact request contained all seven prior accepted root folios and the actual Payment, Band, and
Map plates in story order. Independent predispatch and editorial reads passed. The documents make
Jay's dependence bounded and visible without pretending he can pilot the route; his owned return
passage and entry conditions remain distinct from the company's sponsorship and Tan's father's help.
He names love and the desire for mutual ground, says yes, and immediately turns to ordinary work.
The 253 words are within the 260-word hard ceiling. The three-week absence is a plausible bounded
choice under the current compressed brief; the older one-week/month-end detail is not current C0
authority. The root movement now reaches its intended emotional and causal rest before travel.

## Accepted folio 9 — The licensed route

- Fable operation manifest:
  `2617c6851f0a91b539704542e84fc84be5cc8e16892a3bd52d384b1764220359`
- Official input count: 12,984 tokens
- Provider message/request: `msg_011CdCWxixG7bq7R9WKm4AKx` /
  `req_011CdCWxhWwZhd7hCYspuow2`
- Result: 262 words; `imageDirection: null`; `end_turn`
- Candidate: `10ba801a42c9d5b247c0240addbb594957d17f5d804a1e5a1821b7d97eeb6415`
- Message latency: 30.920 seconds
- Usage-derived text estimate: `$0.229740`

The exact child request contained the founding phrase, full world and temporal rules, and the
licensed-route beat, with no root prose, root plate, or terminal-wall ending. The completed result
makes Eniola's probationary risk, passenger stakes, witnessed observations, physical labor, and
arrival at the outer berth legible. It remains independent of Jay and Tan and uses Phantas Minor as
a navigated axis rather than a magical destination effect.

The provider returned 262 words, two above the original 260-word operational preservation cutoff.
The exact candidate was already archived before postflight refused it, and no redispatch occurred.
A red-first correction changed only the immutable-provider preservation ceiling to 265; 266 words
still fail, while the authoring and reader target remains 120–250. Production provenance will record
two copyedits: delete the repeated “the console demanded” and replace ambiguous “under all four
names” with “beneath their names.” The resulting reader page is 258 words and retains the exact action
and facts.

## Running spend and next operation

Ten Fable calls have an aggregate usage-derived estimate of `$4.412660`. Known C0 text plus the
four completed narrative-image outputs is `$4.652665`; provider billing was not separately queried.
Five of six image operations have been consumed: one credential rejection, one Payment visual
rejection, and three accepted plates. The only remaining image operation is reserved for the Lagos
terminal wall; no repair headroom remains.

Image-led child folio `map-folio-02` is prepared, not dispatched, under request-manifest digest
`95940a4383305e0a34da53a4c612fb9f7921a9f6627c5a2e87a2814b876f5948`. Its exact request contains the
child origin, complete world and temporal rules, The licensed route as its only current-book history,
and the terminal-wall beat. It contains no root prose or root plate as story history. Its schema
requires one complete image direction.
