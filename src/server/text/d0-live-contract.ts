import path from "node:path";
import { pathToFileURL } from "node:url";

import { canonicalJson } from "../domain/digests.js";
import { AnthropicFableClient } from "./fable-client.js";
import {
  compileFableRequest,
  executeFableAttempt,
  FABLE_EFFORT,
  FABLE_MODEL,
  MAX_COUNTED_INPUT,
} from "./fable-contract.js";

/**
 * D0 live contract proof: the smallest useful sample proving the current provider accepts
 * claude-fable-5 with xhigh effort, counts the exact request through the official endpoint, and
 * returns verifiable usage. It runs ONLY with an explicit literal spend-cap confirmation and an
 * ANTHROPIC_API_KEY provided at invocation; without both it refuses — a refusal is BLOCKED
 * evidence, never a pass (EVALS result semantics).
 */
export const D0_LIVE_SPEND_CAP_USD = 2.0;

export function compileD0LiveProbe() {
  return compileFableRequest({
    promptVersion: "d0-live-contract-v1",
    system:
      "You are the writing model behind a small e-reader prototype. This is a provider contract " +
      "probe, not a writing task.",
    userBlocks: [
      {
        text:
          "Reply with one short sentence confirming you received this request. Do not write a " +
          "story or explain anything.",
        type: "text",
      },
    ],
  });
}

export function readD0Arguments(values: string[]): { confirmSpendCap?: number; dryRun: boolean } {
  if (values[0] === "--") values = values.slice(1);
  const parsed: { confirmSpendCap?: number; dryRun: boolean } = { dryRun: false };
  for (let index = 0; index < values.length; index += 1) {
    const key = values[index];
    if (key === "--dry-run") {
      parsed.dryRun = true;
      continue;
    }
    const value = values[index + 1];
    if (value === undefined) throw new Error(`missing value for ${key}`);
    if (key === "--confirm-spend-cap") parsed.confirmSpendCap = Number(value);
    else throw new Error(`unknown D0 live-contract argument: ${key}`);
    index += 1;
  }
  if (!parsed.dryRun && parsed.confirmSpendCap !== D0_LIVE_SPEND_CAP_USD) {
    throw new Error(
      `D0 live contract requires its literal written spend cap: --confirm-spend-cap ` +
        `${D0_LIVE_SPEND_CAP_USD.toFixed(2)}`,
    );
  }
  return parsed;
}

async function main(): Promise<void> {
  const arguments_ = readD0Arguments(process.argv.slice(2));
  const probe = compileD0LiveProbe();
  if (arguments_.dryRun) {
    process.stdout.write(
      `${canonicalJson({ maxCountedInput: MAX_COUNTED_INPUT, mode: "dry-run", probe })}\n`,
    );
    return;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey.trim().length === 0) {
    throw new Error(
      "BLOCKED: ANTHROPIC_API_KEY is required for the live D0 contract proof and is not set",
    );
  }
  const client = new AnthropicFableClient({ apiKey });
  const attempt = await executeFableAttempt(probe, client);
  process.stdout.write(
    `${canonicalJson({
      contract: { effort: FABLE_EFFORT, model: FABLE_MODEL },
      evidence: attempt,
      mode: "live",
      spendCapUsd: D0_LIVE_SPEND_CAP_USD,
    })}\n`,
  );
}

const invokedPath = process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) await main();
