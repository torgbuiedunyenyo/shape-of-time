import { describe, expect, it } from "vitest";

import {
  B2_CONTINUITY_ARCHIVE_ID,
  B2_CONTINUITY_RECOVERY_ROOT,
  B2_CONTINUITY_REVIEW_ROOT,
  B2_CONTINUITY_STAGE1_MAX_ESTIMATE_MICROUSD,
  B2_CONTINUITY_STAGE1_SPEND_CAP_USD,
  b2ContinuityStage1DryRun,
  compileB2ContinuityStage1Candidate,
  readB2ContinuityStage1Arguments,
} from "./b2-continuity-stage1.js";

describe("B2 continuity Stage 1 contract", () => {
  it("binds one text-only root Payment plate to the approved medium and no scene authority beyond F02", () => {
    const candidate = compileB2ContinuityStage1Candidate();

    expect(candidate.request.manifest).toMatchObject({
      endpoint: "/v1/images/generations",
      idempotencyKey: "b2-continuity-root-payment-v1",
      orderedReferences: [],
      quality: "medium",
      requestedModelSnapshot: "gpt-image-2-2026-04-21",
      size: "1024x1536",
    });
    expect(candidate.request.exactPrompt).toMatch(/adult illustrated-novel plate/i);
    expect(candidate.request.exactPrompt).toMatch(/Jay.*Tan|Tan.*Jay/is);
    expect(candidate.request.exactPrompt).toMatch(/specific young adults/i);
    expect(candidate.request.exactPrompt).toMatch(/hands.*phone.*glances.*queue.*distance/is);
    expect(candidate.request.exactPrompt).toMatch(/realize Clef.*without.*form|without being told.*Clef/is);
    expect(candidate.request.exactPrompt).toMatch(/material.*spatial.*beyond.*prose/is);
    expect(candidate.request.exactPrompt).toMatch(/varied observational ink/i);
    expect(candidate.request.exactPrompt).toMatch(/transparent watercolor/i);
    expect(candidate.request.exactPrompt).toMatch(/sparse colored pencil/i);
    expect(candidate.request.exactPrompt).toMatch(/tactile paper.*wear/is);
    expect(candidate.request.exactPrompt).toMatch(/natural perspective/i);
    expect(candidate.request.exactPrompt).toMatch(/concrete faces.*hands/is);
    expect(candidate.request.exactPrompt).toMatch(/comic panels/i);
    expect(candidate.request.exactPrompt).toMatch(/urban-sketch prettification/i);
    expect(candidate.request.exactPrompt).toMatch(/generic sci-fi/i);
    expect(candidate.request.exactPrompt).toMatch(/readable text/i);
    expect(candidate.request.exactPrompt).toMatch(/portals/i);
    expect(candidate.request.exactPrompt).toMatch(/duplicate people/i);
    expect(candidate.request.exactPrompt).toMatch(/do not predefine.*race.*ethnicity/is);
    expect(candidate.request.exactPrompt).toMatch(/do not predefine.*shop plan/is);
    expect(candidate.request.exactPrompt).toMatch(/do not predefine.*future style/is);
    expect(candidate.request.exactPrompt).toMatch(/do not predefine.*palette/is);
  });

  it("fixes one operation, the owner archive/review roots, and the conservative $0.05 cap", () => {
    expect(B2_CONTINUITY_ARCHIVE_ID).toBe("b2-visual-study-2026-07");
    expect(B2_CONTINUITY_RECOVERY_ROOT).toBe("/Users/ratpartyserver/git/shape-of-time-b2-recovery");
    expect(B2_CONTINUITY_REVIEW_ROOT).toBe(
      "/Users/ratpartyserver/git/shape-of-time-b2-review/continuity-v1",
    );
    expect(B2_CONTINUITY_STAGE1_MAX_ESTIMATE_MICROUSD).toBe(50_000);
    expect(B2_CONTINUITY_STAGE1_SPEND_CAP_USD).toBe(0.05);
    expect(b2ContinuityStage1DryRun()).toMatchObject({
      archiveId: B2_CONTINUITY_ARCHIVE_ID,
      archiveRoot: B2_CONTINUITY_RECOVERY_ROOT,
      maximumPlannedEstimateMicrousd: 50_000,
      plannedProviderOperations: 1,
      reviewRoot: B2_CONTINUITY_REVIEW_ROOT,
      spendAuthorizationBoundUsd: 0.05,
    });
  });

  it("requires the exact inspected dry-run digest and literal cap before live execution", () => {
    const digest = b2ContinuityStage1DryRun().studyDigest;

    expect(readB2ContinuityStage1Arguments(["--dry-run"])).toEqual({ dryRun: true });
    expect(
      readB2ContinuityStage1Arguments([
        "--confirm-study-digest",
        digest,
        "--confirm-spend-cap",
        "0.05",
      ]),
    ).toEqual({ confirmSpendCap: 0.05, confirmedStudyDigest: digest, dryRun: false });
    expect(() =>
      readB2ContinuityStage1Arguments([
        "--confirm-study-digest",
        "0".repeat(64),
        "--confirm-spend-cap",
        "0.05",
      ]),
    ).toThrow(/study[- ]digest/i);
    expect(() =>
      readB2ContinuityStage1Arguments([
        "--confirm-study-digest",
        digest,
        "--confirm-spend-cap",
        "0.06",
      ]),
    ).toThrow(/spend cap/i);
  });
});
