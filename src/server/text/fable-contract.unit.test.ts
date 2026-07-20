import { describe, expect, it, vi } from "vitest";

import {
  ABSOLUTE_CONTEXT_CEILING,
  compileFableRequest,
  executeFableAttempt,
  FABLE_EFFORT,
  FABLE_MODEL,
  FableContractError,
  MAX_COUNTED_INPUT,
  MAX_OUTPUT_TOKENS,
  SAFETY_MARGIN,
  type FableProviderPort,
} from "./fable-contract.js";

function compiled(system = "You are writing one folio.", user = "Write folio one.") {
  return compileFableRequest({
    promptVersion: "d0-contract-test-v1",
    system,
    userBlocks: [{ text: user, type: "text" }],
  });
}

function fakePort(overrides: Partial<{
  countedInput: number;
  countFails: boolean;
  response: Record<string, unknown>;
}> = {}): FableProviderPort & { count: ReturnType<typeof vi.fn>; send: ReturnType<typeof vi.fn> } {
  const count = vi.fn(async () => {
    if (overrides.countFails) throw new Error("count endpoint unavailable");
    return { input_tokens: overrides.countedInput ?? 12_000 };
  });
  const send = vi.fn(async () => overrides.response ?? {
    content: [{ text: "The shop had been open an hour when Tan came in.", type: "text" }],
    id: "msg_d0_contract_test",
    model: FABLE_MODEL,
    stop_reason: "end_turn",
    usage: { input_tokens: 12_000, output_tokens: 180 },
  });
  return { count, send };
}

describe("D0 Fable contract", () => {
  it("pins the hard context equation exactly", () => {
    expect(FABLE_MODEL).toBe("claude-fable-5");
    expect(FABLE_EFFORT).toBe("xhigh");
    expect(ABSOLUTE_CONTEXT_CEILING).toBe(400_000);
    expect(MAX_OUTPUT_TOKENS).toBe(32_768);
    expect(SAFETY_MARGIN).toBe(4_096);
    expect(MAX_COUNTED_INPUT).toBe(363_136);
    expect(MAX_COUNTED_INPUT + MAX_OUTPUT_TOKENS + SAFETY_MARGIN).toBe(ABSOLUTE_CONTEXT_CEILING);
  });

  it("compiles the exact stateless request body with no fallback surface", () => {
    const request = compiled();
    expect(request.body).toMatchObject({
      max_tokens: MAX_OUTPUT_TOKENS,
      model: FABLE_MODEL,
      output_config: { effort: FABLE_EFFORT },
    });
    // Stateless and reproducible: no provider memory, compaction, or manual thinking budget.
    expect(JSON.stringify(request.body)).not.toMatch(/opus|fallback|memory|compaction/i);
    expect(request.manifest.promptVersion).toBe("d0-contract-test-v1");
    expect(request.manifestDigest).toMatch(/^[a-f0-9]{64}$/);
    // The manifest digest is bound to the exact body: any change changes it.
    expect(compiled("You are writing one folio.", "Write folio two.").manifestDigest).not.toBe(
      request.manifestDigest,
    );
  });

  it("admits exactly up to MAX_COUNTED_INPUT and refuses one token over, before any send", async () => {
    const atLimit = fakePort({ countedInput: MAX_COUNTED_INPUT });
    await expect(executeFableAttempt(compiled(), atLimit)).resolves.toMatchObject({
      countedInputTokens: MAX_COUNTED_INPUT,
    });

    const overLimit = fakePort({ countedInput: MAX_COUNTED_INPUT + 1 });
    await expect(executeFableAttempt(compiled(), overLimit)).rejects.toMatchObject({
      code: "over_context_ceiling",
    });
    expect(overLimit.send).not.toHaveBeenCalled();
  });

  it("blocks generation when counting fails — no character estimate stands in", async () => {
    const port = fakePort({ countFails: true });
    await expect(executeFableAttempt(compiled(), port)).rejects.toMatchObject({
      code: "count_failed",
    });
    expect(port.send).not.toHaveBeenCalled();
  });

  it("distinguishes an explicit provider rejection from an indeterminate dispatch", async () => {
    const rejected = fakePort();
    rejected.send.mockRejectedValueOnce(Object.assign(new Error("rate limited"), { httpStatus: 429 }));
    await expect(executeFableAttempt(compiled(), rejected)).rejects.toMatchObject({
      code: "provider_rejected",
    });

    const ambiguous = fakePort();
    ambiguous.send.mockRejectedValueOnce(new Error("connection ended after dispatch"));
    await expect(executeFableAttempt(compiled(), ambiguous)).rejects.toMatchObject({
      code: "dispatch_indeterminate",
    });
  });

  it("rejects a served model that is not exactly Fable, including an Opus alias", async () => {
    const port = fakePort({
      response: {
        content: [{ text: "prose", type: "text" }],
        id: "msg_wrong_model",
        model: "claude-opus-4-8",
        stop_reason: "end_turn",
        usage: { input_tokens: 10, output_tokens: 5 },
      },
    });
    await expect(executeFableAttempt(compiled(), port)).rejects.toMatchObject({
      code: "served_model_mismatch",
    });
  });

  it("distinguishes truncation, refusal, empty output, and unsupported stop reasons", async () => {
    const cases = [
      { code: "truncated", response: { stop_reason: "max_tokens" } },
      { code: "refused", response: { stop_reason: "refusal" } },
      { code: "empty_output", response: { content: [] } },
      { code: "unsupported_stop", response: { stop_reason: "tool_use" } },
    ] as const;
    for (const testCase of cases) {
      const port = fakePort({
        response: {
          content: [{ text: "some prose", type: "text" }],
          id: `msg_${testCase.code}`,
          model: FABLE_MODEL,
          stop_reason: "end_turn",
          usage: { input_tokens: 10, output_tokens: 5 },
          ...testCase.response,
        },
      });
      await expect(executeFableAttempt(compiled(), port)).rejects.toMatchObject({
        code: testCase.code,
      });
    }
  });

  it("returns full provenance on success: response id, usage, counted input, manifest digest", async () => {
    const port = fakePort();
    const attempt = await executeFableAttempt(compiled(), port);
    expect(attempt).toMatchObject({
      providerResponseId: "msg_d0_contract_test",
      servedModel: FABLE_MODEL,
      usage: { input_tokens: 12_000, output_tokens: 180 },
    });
    expect(attempt.prose.length).toBeGreaterThan(0);
    expect(attempt.manifestDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(port.count).toHaveBeenCalledTimes(1);
    expect(port.send).toHaveBeenCalledTimes(1);
  });

  it("exposes contract errors as a named class that fails closed", () => {
    const error = new FableContractError({ code: "count_failed", message: "count endpoint unavailable" });
    expect(error).toBeInstanceOf(Error);
    expect(error.code).toBe("count_failed");
  });
});
