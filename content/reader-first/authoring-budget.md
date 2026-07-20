# Reader-first authoring budget

This ceiling covers only the bounded C0 editorial run. It does not authorize D0–D6 production
generation, the frozen B2 Stage 1 operation, retries of any historical operation, or garden
expansion.

The prose run permits ten ordinary direct Anthropic Messages API operations, one per folio, plus one
explicitly linked replacement for the retained structurally unusable first Map response: eleven
operations total. Every operation uses `claude-fable-5`, `xhigh` effort, and
`max_tokens: 32768`. The replacement is available only through the red-first boundary that verifies
the original fixed claim, HTTP 200 response, named empty structured result, and absent candidate; it
cannot be used for ordinary editorial revision or a second retry. The exact multimodal input envelope
is first submitted to the provider token-count endpoint and durably admitted before the one inference
dispatch. Each operation has a `$2.00` worst-case projected-cost ceiling at the recorded 2026-06-09
standard Fable rates; the tranche ceiling is `$22.00`. The projection uses the provider-counted input
plus all 32,768 possible output tokens, so it is deliberately higher than expected cost. There is no
fallback model, repair writer, automatic resend, or extra image-direction call.

The request shape follows Anthropic's current official documentation for
[token counting](https://platform.claude.com/docs/en/build-with-claude/token-counting),
[structured outputs](https://platform.claude.com/docs/en/build-with-claude/structured-outputs), and
[effort](https://platform.claude.com/docs/en/build-with-claude/effort). The cost projection uses the
[published Fable 5 standard rates](https://platform.claude.com/docs/en/about-claude/pricing) recorded
in each operation manifest.

The plate run permits four accepted GPT Image 2 operations, one per named C0 plate, plus two bounded
Payment repair operations authorized only after preserved failures: six operations and `$0.60` in
aggregate, with a `$0.10` request-scope estimate ceiling per operation. The first Payment attempt was
rejected before generation because of an invalid credential; the second completed but failed visual
review; neither became history or a reference. Every operation uses a distinct C0 idempotency key,
the existing durable journal, the exact requested `gpt-image-2-2026-04-21` snapshot, and external
recovery. An ambiguous result is not retried. A rejected candidate may be replaced only by recording
a new bounded decision before another call; it never enters Fable history or image references.

The Fable sequence pauses after an illustrated folio until its plate is generated, reviewed, and
accepted. This is required because every later Fable request in that book contains the actual prior
images interleaved with the prose. No call may silently omit an image to keep the sequence moving.
