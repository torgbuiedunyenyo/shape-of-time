import { describe, expect, it } from "vitest";

import {
  B2_TREATMENT_ARCHIVE_ID,
  B2_TREATMENT_MAX_ESTIMATE_MICROUSD,
  B2_TREATMENT_RECOVERY_ROOT,
  B2_TREATMENT_REVIEW_ROOT,
  B2_TREATMENT_SPEND_CAP_USD,
  compileTreatmentCandidates,
  readB2VisualStudyArguments,
  treatmentStudyDryRun,
} from "./b2-visual-study.js";

describe("B2 visual-direction study", () => {
  it("compiles exactly three comparable, narrative, medium landscape generations", () => {
    const candidates = compileTreatmentCandidates();

    expect(candidates).toHaveLength(3);
    expect(new Set(candidates.map(({ treatmentId }) => treatmentId)).size).toBe(3);
    expect(new Set(candidates.map(({ request }) => request.manifest.idempotencyKey)).size).toBe(3);
    for (const { request } of candidates) {
      expect(request.manifest).toMatchObject({
        endpoint: "/v1/images/generations",
        purpose: "narrative",
        quality: "medium",
        size: "1536x1024",
      });
      expect(request.manifest.orderedReferences).toEqual([]);
      expect(request.exactPrompt).toContain("same comparison scene");
      expect(request.exactPrompt).not.toMatch(/Jay|Tan|Eniola|Mara|Ana|Oakland|Lagos|Stepney|Recife|Clef/i);
    }
    expect(B2_TREATMENT_MAX_ESTIMATE_MICROUSD * candidates.length).toBeLessThanOrEqual(
      B2_TREATMENT_SPEND_CAP_USD * 1_000_000,
    );
  });

  it("requires the literal written spend cap and explicit external roots for a live run", () => {
    expect(readB2VisualStudyArguments(["--dry-run"])).toEqual({ dryRun: true });
    const studyDigest = treatmentStudyDryRun().studyDigest;
    expect(
      readB2VisualStudyArguments([
        "--confirm-study-digest",
        studyDigest,
        "--confirm-spend-cap",
        "0.15",
      ]),
    ).toEqual({ confirmSpendCap: 0.15, confirmedStudyDigest: studyDigest, dryRun: false });
    expect(() =>
      readB2VisualStudyArguments([
        "--confirm-study-digest",
        studyDigest,
        "--confirm-spend-cap",
        "0.14",
      ]),
    ).toThrow(/0\.15|spend cap/i);
    expect(() =>
      readB2VisualStudyArguments([
        "--confirm-study-digest",
        "0".repeat(64),
        "--confirm-spend-cap",
        "0.15",
      ]),
    ).toThrow(/study[- ]digest/i);
    expect(() =>
      readB2VisualStudyArguments([
        "--confirm-study-digest",
        studyDigest,
        "--confirm-spend-cap",
        "0.15",
        "--recovery-root",
        "/external/fresh-archive",
      ]),
    ).toThrow(/unknown.*recovery-root/i);
    expect(
      readB2VisualStudyArguments([
        "--confirm-study-digest",
        studyDigest,
        "--confirm-spend-cap",
        "0.15",
        "--acknowledge-indeterminate",
        `b2-treatment-b-v1:${"a".repeat(64)}`,
      ]),
    ).toMatchObject({
      acknowledgedIndeterminate: {
        idempotencyKey: "b2-treatment-b-v1",
        terminalDigest: "a".repeat(64),
      },
    });

    expect(B2_TREATMENT_ARCHIVE_ID).toBe("b2-visual-study-2026-07");
    expect(B2_TREATMENT_RECOVERY_ROOT).toBe("/Users/ratpartyserver/git/shape-of-time-b2-recovery");
    expect(B2_TREATMENT_REVIEW_ROOT).toBe(
      "/Users/ratpartyserver/git/shape-of-time-b2-review/medium-comparison-v1",
    );
  });
});
