import { describe, expect, it } from "vitest";

import {
  acceptPlannedMovement,
  compileMovementPlanningRequest,
  parseMovementBrief,
  type MovementPlanningInput,
} from "./movement-planner.js";

function input(overrides: Partial<MovementPlanningInput> = {}): MovementPlanningInput {
  return {
    bookOrigin: "This is the root book of the library.",
    completedMovements: [
      { brief: "From the failed payment to Jay's calm yes.", id: "root-movement-01" },
    ],
    exposedTail: "Jay said yes, and the shop's evening noise carried on around the word.",
    phase: "root_pre_arc",
    temporalRules: "Temporal movement is physical travel along mapped currents.",
    world: "Shape of Time world. One person exists once; every time keeps living.",
    ...overrides,
  };
}

function requestText(request: ReturnType<typeof compileMovementPlanningRequest>): string {
  return request.request.body.messages[0]?.content
    .flatMap((block) => block.type === "text" ? [block.text] : [])
    .join("") ?? "";
}

describe("D3 movement planning request", () => {
  it("compiles one bounded request whose phase instruction matches the book phase", () => {
    const preArc = compileMovementPlanningRequest(input());
    const preArcText = requestText(preArc);
    expect(preArcText).toContain("next unresolved movement of the source story");
    expect(preArcText).toContain("<movement_brief>");

    const postArc = compileMovementPlanningRequest(input({ phase: "root_post_arc" }));
    const postArcText = requestText(postArc);
    expect(postArcText).toMatch(/changed situation|true ending/i);
    expect(postArcText).toMatch(/new dramatic engine/i);
    expect(postArcText).not.toMatch(/next unresolved movement/i);

    const childFirst = compileMovementPlanningRequest(
      input({
        bookOrigin: "Founded from the passage: 'the till drawer full of unfamiliar coin'.",
        exposedTail: "",
        phase: "child_first",
      }),
    );
    const childText = requestText(childFirst);
    expect(childText).toMatch(/reference, not (a |its )?(plot )?template/i);
    expect(childText).toMatch(/viewpoint/i);
  });

  it("keeps completed movements in order and refuses Undertow in any planning source", () => {
    const compiled = compileMovementPlanningRequest(input());
    const text = requestText(compiled);
    expect(text).toContain("root-movement-01");
    expect(() =>
      compileMovementPlanningRequest(input({ world: "world with Undertow seed inside" })),
    ).toThrow(/undertow/i);
  });

  it("is deterministic and digest-bound", () => {
    expect(compileMovementPlanningRequest(input()).planningDigest).toBe(
      compileMovementPlanningRequest(input()).planningDigest,
    );
    expect(
      compileMovementPlanningRequest(input({ exposedTail: "A different ending." })).planningDigest,
    ).not.toBe(compileMovementPlanningRequest(input()).planningDigest);
  });
});

describe("D3 movement brief acceptance", () => {
  it("parses exactly one movement_brief element with nothing outside it", () => {
    expect(parseMovementBrief("<movement_brief>Jay packs one bag.</movement_brief>")).toBe(
      "Jay packs one bag.",
    );
    expect(() => parseMovementBrief("no element")).toThrow(/movement_brief/i);
    expect(() =>
      parseMovementBrief("plan: <movement_brief>x</movement_brief>"),
    ).toThrow(/outside/i);
  });

  it("refuses replaying a completed movement id", () => {
    expect(() =>
      acceptPlannedMovement({
        brief: "Do the courtship again.",
        completedMovements: input().completedMovements,
        newMovementId: "root-movement-01",
        phase: "root_pre_arc",
      }),
    ).toThrow(/already/i);
  });

  it("refuses a planned brief that imports Undertow by default", () => {
    expect(() =>
      acceptPlannedMovement({
        brief: "The Undertow rises beneath the currents.",
        completedMovements: [],
        newMovementId: "root-movement-02",
        phase: "root_post_arc",
      }),
    ).toThrow(/undertow/i);
  });

  it("accepts a legitimate next movement", () => {
    expect(
      acceptPlannedMovement({
        brief: "The journey to Tan's time, from departure to first arrival.",
        completedMovements: input().completedMovements,
        newMovementId: "root-movement-02",
        phase: "root_pre_arc",
      }),
    ).toEqual({
      brief: "The journey to Tan's time, from departure to first arrival.",
      id: "root-movement-02",
    });
  });
});
