import path from "node:path";
import { pathToFileURL } from "node:url";

import { writeImmutable } from "../assets/filesystem-recovery-archive.js";
import { canonicalJson } from "../domain/digests.js";
import { compileFolioContext } from "./folio-context.js";
import { AnthropicFableClient } from "./fable-client.js";
import {
  baselineFolioBrief,
  D2_LIVE_SPEND_CAP_USD,
  loadBaselineSources,
  readD2Arguments,
  runBaseline,
} from "./d2-baseline.js";

/**
 * D2 live baseline runner. Dry-run is keyless and prints the exact folio-1 context digest and
 * manifest for inspection before any spend. The live run requires ANTHROPIC_API_KEY at
 * invocation, the literal written spend cap, and an absolute archive root outside the worktree;
 * without all three it refuses — a refusal is BLOCKED evidence, never a pass.
 */
async function main(): Promise<void> {
  const arguments_ = readD2Arguments(process.argv.slice(2));
  const sources = loadBaselineSources(process.cwd());

  if (arguments_.dryRun) {
    const first = compileFolioContext({
      bookOrigin: sources.bookOrigin,
      currentFolioBrief: baselineFolioBrief(1),
      movementBrief: sources.movementBrief,
      priorFolios: [],
      temporalRules: sources.temporalRules,
      world: sources.world,
    });
    process.stdout.write(
      `${canonicalJson({
        contextDigest: first.contextDigest,
        contextManifest: first.contextManifest,
        mode: "dry-run",
        renderedBytes: Buffer.byteLength(
          first.request.body.messages[0]?.content[0]?.text ?? "",
          "utf8",
        ),
        spendCapUsd: D2_LIVE_SPEND_CAP_USD,
      })}\n`,
    );
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey === undefined || apiKey.trim().length === 0) {
    throw new Error(
      "BLOCKED: ANTHROPIC_API_KEY is required for the live D2 baseline run and is not set",
    );
  }
  const archiveRoot = path.resolve(arguments_.archiveRoot!);
  const worktree = path.resolve(process.cwd());
  if (archiveRoot === worktree || archiveRoot.startsWith(`${worktree}${path.sep}`)) {
    throw new Error("the paid baseline archive must live outside the project worktree");
  }
  const client = new AnthropicFableClient({ apiKey });
  const result = await runBaseline({
    archive: (name, bytes) =>
      writeImmutable(path.join(archiveRoot, name), bytes, archiveRoot).then(() => undefined),
    folioCount: arguments_.folioCount!,
    port: client,
    sources,
  });
  process.stdout.write(
    `${canonicalJson({
      archiveRoot,
      failure: result.failure ?? null,
      folios: result.folios.map((folio) => ({
        latencyMs: folio.latencyMs,
        ordinal: folio.ordinal,
        proseDigest: folio.proseDigest,
        usage: folio.usage,
        wordCount: folio.wordCount,
      })),
      mode: "live",
      outcome: result.outcome,
      spendCapUsd: D2_LIVE_SPEND_CAP_USD,
      totals: result.totals,
    })}\n`,
  );
  if (result.outcome === "failed") process.exitCode = 1;
}

const invokedPath =
  process.argv[1] === undefined ? undefined : pathToFileURL(path.resolve(process.argv[1])).href;
if (invokedPath === import.meta.url) await main();
