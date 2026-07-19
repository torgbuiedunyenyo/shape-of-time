import { describe, expect, it } from "vitest";

import type { FableRequestBody } from "./fable-contract.js";
import {
  baselineFolioBrief,
  loadBaselineSources,
  MAX_BASELINE_FOLIOS,
  MIN_BASELINE_FOLIOS,
  parseFolioProse,
  readD2Arguments,
  runBaseline,
  type BaselineSources,
} from "./d2-baseline.js";

const PROSE_WORDS = Array.from({ length: 150 }, (_, index) => `word${index}`).join(" ");

function sources(): BaselineSources {
  return {
    bookOrigin: "This is the root book of the library. It has no parent and no founding passage.",
    movementBrief: "Root movement one: from the failed payment to Jay's calm yes.",
    temporalRules: "Temporal movement is physical travel along mapped currents.",
    world: "Shape of Time world. One person exists once; every time keeps living.",
  };
}

interface FakeCall {
  body: FableRequestBody;
}

function fakePort(options: { failAtCall?: number; proseFor: (call: number) => string }) {
  const calls: FakeCall[] = [];
  return {
    calls,
    count: (body: FableRequestBody) => {
      void body;
      return Promise.resolve({ input_tokens: 1_000 });
    },
    send: (body: FableRequestBody) => {
      calls.push({ body });
      const call = calls.length;
      const truncate = options.failAtCall !== undefined && call >= options.failAtCall;
      return Promise.resolve({
        content: [{ text: options.proseFor(call), type: "text" }],
        id: `msg_${call}`,
        model: "claude-fable-5",
        stop_reason: truncate ? "max_tokens" : "end_turn",
        usage: { input_tokens: 1_000, output_tokens: 300 },
      });
    },
  };
}

function memoryArchive() {
  const names: string[] = [];
  const files = new Map<string, string>();
  return {
    files,
    names,
    write: (name: string, bytes: Uint8Array) => {
      names.push(name);
      files.set(name, new TextDecoder().decode(bytes));
      return Promise.resolve();
    },
  };
}

describe("D2 folio prose parsing", () => {
  it("extracts the prose of exactly one folio_prose element", () => {
    expect(parseFolioProse("<folio_prose>\nJay counted the till.\n</folio_prose>")).toBe(
      "Jay counted the till.",
    );
  });

  it("refuses a reply with no folio_prose element", () => {
    expect(() => parseFolioProse("Jay counted the till.")).toThrow(/folio_prose/i);
  });

  it("refuses more than one folio_prose element", () => {
    expect(() =>
      parseFolioProse("<folio_prose>a</folio_prose><folio_prose>b</folio_prose>"),
    ).toThrow(/exactly one/i);
  });

  it("refuses commentary outside the element and an empty element", () => {
    expect(() =>
      parseFolioProse("Here is my folio: <folio_prose>Jay waited.</folio_prose>"),
    ).toThrow(/outside/i);
    expect(() => parseFolioProse("<folio_prose>  \n </folio_prose>")).toThrow(/empty/i);
  });
});

describe("D2 baseline run", () => {
  it("runs N consecutive folios, each seeing all prior prose in exposure order", async () => {
    const port = fakePort({
      proseFor: (call) => `<folio_prose>Sentinel-${call} arrives. ${PROSE_WORDS}</folio_prose>`,
    });
    const archive = memoryArchive();
    const result = await runBaseline({
      archive: archive.write,
      clock: () => 0,
      folioCount: MIN_BASELINE_FOLIOS,
      port,
      sources: sources(),
    });

    expect(result.outcome).toBe("completed");
    expect(result.folios).toHaveLength(MIN_BASELINE_FOLIOS);
    expect(port.calls).toHaveLength(MIN_BASELINE_FOLIOS);
    // Folio 3's request carries folio 1 and folio 2 prose, in order, exactly once each.
    const thirdRequest = port.calls[2]?.body.messages[0]?.content[0]?.text ?? "";
    expect(thirdRequest.split("Sentinel-1 arrives.").length - 1).toBe(1);
    expect(thirdRequest.split("Sentinel-2 arrives.").length - 1).toBe(1);
    expect(thirdRequest.indexOf("Sentinel-1 arrives.")).toBeLessThan(
      thirdRequest.indexOf("Sentinel-2 arrives."),
    );
    expect(thirdRequest).not.toContain("Sentinel-3 arrives.");
    // The archive holds a request record before each result record, and the summary last.
    expect(archive.names.indexOf("folio-01.request.json")).toBeLessThan(
      archive.names.indexOf("folio-01.result.json"),
    );
    expect(archive.names.at(-1)).toBe("run.json");
    // Usage totals are summed from provider evidence, and cost is never invented.
    expect(result.totals.outputTokens).toBe(300 * MIN_BASELINE_FOLIOS);
    expect(result.costUsd).toBeNull();
    expect(result.costBasis).toMatch(/usage/i);
  });

  it("stops at the first contract failure with no retry and archives the failure", async () => {
    const port = fakePort({
      failAtCall: 3,
      proseFor: (call) => `<folio_prose>Sentinel-${call}. ${PROSE_WORDS}</folio_prose>`,
    });
    const archive = memoryArchive();
    const result = await runBaseline({
      archive: archive.write,
      clock: () => 0,
      folioCount: 10,
      port,
      sources: sources(),
    });

    expect(result.outcome).toBe("failed");
    expect(result.failure?.code).toBe("truncated");
    expect(result.failure?.ordinal).toBe(3);
    expect(result.folios).toHaveLength(2);
    // Exactly one attempt per folio: the failing call was made once and never repeated.
    expect(port.calls).toHaveLength(3);
    expect(archive.names).toContain("folio-03.failure.json");
    expect(archive.names).not.toContain("folio-04.request.json");
    expect(archive.names.at(-1)).toBe("run.json");
  });

  it("records an out-of-range word count as an observation, not a failure", async () => {
    const port = fakePort({
      proseFor: (call) => `<folio_prose>Sentinel-${call}. Only a few words here.</folio_prose>`,
    });
    const archive = memoryArchive();
    const result = await runBaseline({
      archive: archive.write,
      clock: () => 0,
      folioCount: 8,
      port,
      sources: sources(),
    });
    expect(result.outcome).toBe("completed");
    expect(result.folios[0]?.wordCountInRange).toBe(false);
  });

  it("refuses a folio count outside the 8-14 baseline window", async () => {
    for (const folioCount of [MIN_BASELINE_FOLIOS - 1, MAX_BASELINE_FOLIOS + 1, 0.5]) {
      await expect(
        runBaseline({
          archive: memoryArchive().write,
          folioCount,
          port: fakePort({ proseFor: () => "<folio_prose>x</folio_prose>" }),
          sources: sources(),
        }),
      ).rejects.toThrow(/8/);
    }
  });

  it("treats a malformed reply as a named failure and stops the run", async () => {
    const port = fakePort({
      proseFor: (call) =>
        call === 2 ? "I planned the folio first. <folio_prose>x</folio_prose>" : `<folio_prose>S${call}. ${PROSE_WORDS}</folio_prose>`,
    });
    const result = await runBaseline({
      archive: memoryArchive().write,
      clock: () => 0,
      folioCount: 9,
      port,
      sources: sources(),
    });
    expect(result.outcome).toBe("failed");
    expect(result.failure?.code).toBe("malformed_output");
    expect(result.failure?.ordinal).toBe(2);
    expect(port.calls).toHaveLength(2);
  });
});

describe("D2 sources and steering", () => {
  it("loads the real repo sources and compiles a folio-1 context from them", () => {
    const loaded = loadBaselineSources(process.cwd());
    expect(loaded.movementBrief).toContain("First Root Movement");
    expect(loaded.world.length).toBeGreaterThan(10_000);
    expect(loaded.temporalRules.trim().length).toBeGreaterThan(0);
    expect(loaded.bookOrigin).toMatch(/root book/i);
  });

  it("keeps the per-folio steering light and ordinal-specific", () => {
    expect(baselineFolioBrief(1)).toMatch(/first folio|opening/i);
    expect(baselineFolioBrief(4)).toContain("4");
    expect(baselineFolioBrief(4)).not.toBe(baselineFolioBrief(5));
  });
});

describe("D2 live-run arguments", () => {
  it("accepts a dry run with no key and no cap", () => {
    expect(readD2Arguments(["--dry-run"]).dryRun).toBe(true);
  });

  it("requires the literal written spend cap, a folio count, and an absolute archive root", () => {
    const good = [
      "--confirm-spend-cap",
      "25.00",
      "--folios",
      "10",
      "--archive-root",
      "/var/shape-of-time/d2-baseline",
    ];
    expect(readD2Arguments(good)).toEqual({
      archiveRoot: "/var/shape-of-time/d2-baseline",
      confirmSpendCap: 25,
      dryRun: false,
      folioCount: 10,
    });
    expect(() => readD2Arguments(["--folios", "10", "--archive-root", "/a"])).toThrow(
      /spend cap/i,
    );
    expect(() =>
      readD2Arguments(["--confirm-spend-cap", "5.00", "--folios", "10", "--archive-root", "/a"]),
    ).toThrow(/25\.00/);
    expect(() =>
      readD2Arguments(["--confirm-spend-cap", "25.00", "--folios", "10", "--archive-root", "rel"]),
    ).toThrow(/absolute/i);
    expect(() =>
      readD2Arguments(["--confirm-spend-cap", "25.00", "--archive-root", "/a"]),
    ).toThrow(/folio/i);
  });
});
