import { describe, expect, it, vi } from "vitest";

import { digestJson, sha256 } from "../domain/digests.js";
import {
  GPT_IMAGE_SNAPSHOT,
  compileImageRequest,
  type ImageAnchorRequirement,
  type ImageReference,
} from "./image-contract.js";
import {
  ImageProviderError,
  OpenAiImageClient,
  replayImageResult,
  sanitizeImageResult,
} from "./openai-image-client.js";
import {
  indexedPngWithDuplicatePalette,
  indexedPngWithOutOfRangeSample,
  indexedPngWithOversizedPalette,
  pngWithTrailingCompressedByte,
  pngWithReservedBitChunk,
  pngWithTransparencyAfterImageData,
  pngWithoutImageData,
  transparentRgbaPng,
  validPng,
} from "./png-test-support.js";

function reference(assetId: string, role: string, description: string): ImageReference {
  const color = [...assetId].reduce((value, character) => (value + character.charCodeAt(0)) % 255, 1);
  const bytes = validPng(8, 8, [color, (color * 3) % 255, (color * 7) % 255]);
  return {
    assetId,
    byteLength: bytes.byteLength,
    bytes,
    description,
    digest: sha256(bytes),
    mediaType: "image/png",
    provenance: {
      evidenceId: `human-review-${assetId}`,
      kind: "human-approved-anchor",
      scope: role === "identity" ? "recurring-identity" : "book-local",
    },
    role,
  };
}

function required(reference: ImageReference): ImageAnchorRequirement {
  return { assetId: reference.assetId, digest: reference.digest, role: reference.role };
}

describe("GPT Image 2 request contract", () => {
  it("pins a text-only generation manifest to the exact snapshot and documented fields", () => {
    const compiled = compileImageRequest({
      idempotencyKey: "root-folio-01-plate",
      kind: "generate",
      prompt: "A phone held above a payment terminal; the receipt remains unreadable.",
      promptVersion: "visual-direction-candidate-v1",
      quality: "low",
      size: "1024x1024",
    });

    expect(compiled.manifest).toMatchObject({
      endpoint: "/v1/images/generations",
      idempotencyScope: "application-only-no-provider-replay",
      requestedModelSnapshot: GPT_IMAGE_SNAPSHOT,
      servedModelEvidence: "unavailable-from-image-api",
    });
    expect(compiled.manifest.orderedReferences).toEqual([]);
    expect(compiled.manifestDigest).toMatch(/^[a-f0-9]{64}$/);
  });

  it("preserves two-to-five edit references in order and makes reordering change the manifest", () => {
    const identity = reference("asset-identity", "identity", "Jay's face and build");
    const place = reference("asset-place", "place", "The same market counter");
    const base = {
      idempotencyKey: "root-folio-02-plate",
      kind: "edit" as const,
      prompt: "Jay turns away from the counter while the clerk reaches for the paper roll.",
      promptVersion: "visual-direction-candidate-v1",
      quality: "medium" as const,
      size: "1536x1024" as const,
    };

    const first = compileImageRequest({
      ...base,
      references: [identity, place],
      requiredAnchors: [required(identity), required(place)],
    });
    const second = compileImageRequest({
      ...base,
      references: [place, identity],
      requiredAnchors: [required(identity), required(place)],
    });

    expect(first.manifest.orderedReferences.map(({ assetId, position }) => [position, assetId])).toEqual([
      [1, "asset-identity"],
      [2, "asset-place"],
    ]);
    expect(first.exactPrompt).toContain("Image 1 — identity: Jay's face and build");
    expect(first.exactPrompt).toContain("Image 2 — place: The same market counter");
    expect(first.manifestDigest).not.toBe(second.manifestDigest);
  });

  it("rejects missing anchors, mutated reference bytes, and unsupported output geometry", () => {
    expect(() =>
      compileImageRequest({
        idempotencyKey: "too-few-references",
        kind: "edit",
        prompt: "Continue the scene.",
        promptVersion: "v1",
        quality: "low",
        references: [reference("only", "identity", "Only one anchor")],
        requiredAnchors: [],
        size: "1024x1024",
      }),
    ).toThrow(/two to five ordered references/);

    const changed = reference("changed", "place", "A place");
    changed.bytes[20] = 1;
    expect(() =>
      compileImageRequest({
        idempotencyKey: "changed-bytes",
        kind: "edit",
        prompt: "Continue the scene.",
        promptVersion: "v1",
        quality: "low",
        references: [changed, reference("identity", "identity", "A person")],
        requiredAnchors: [required(changed)],
        size: "1024x1024",
      }),
    ).toThrow(/reference digest/);

    expect(() =>
      compileImageRequest({
        idempotencyKey: "bad-size",
        kind: "generate",
        prompt: "Continue the scene.",
        promptVersion: "v1",
        quality: "low",
        size: "1000x1000" as never,
      }),
    ).toThrow(/supported prototype image size/);
  });

  it("rejects an omitted required anchor, substituted anchor evidence, and duplicate reference content", () => {
    const identity = reference("identity", "identity", "The recurring face");
    const place = reference("place", "place", "The recurring room");
    const neighbor = reference("neighbor", "causal-neighbor", "The prior scene");
    const base = {
      idempotencyKey: "anchor-contract",
      kind: "edit" as const,
      prompt: "Continue the scene.",
      promptVersion: "v1",
      quality: "low" as const,
      size: "1024x1024" as const,
    };

    expect(() =>
      compileImageRequest({
        ...base,
        references: [identity, neighbor],
        requiredAnchors: [required(identity), required(place)],
      }),
    ).toThrow(/required anchor.*place/i);

    expect(() =>
      compileImageRequest({
        ...base,
        references: [{ ...place, role: "object" }, identity],
        requiredAnchors: [required(identity), required(place)],
      }),
    ).toThrow(/required anchor.*place/i);

    expect(() =>
      compileImageRequest({
        ...base,
        references: [identity, { ...place, bytes: identity.bytes, digest: identity.digest, byteLength: identity.byteLength }],
        requiredAnchors: [required(identity), { ...required(place), digest: identity.digest }],
      }),
    ).toThrow(/duplicate reference content/i);
  });

  it("rejects edit references without eligible approval or exposed-folio provenance", () => {
    const rejected = reference("rejected-candidate", "identity", "A provider candidate that was rejected");
    const place = reference("place", "place", "A reviewed place");

    expect(() =>
      compileImageRequest({
        idempotencyKey: "unapproved-reference",
        kind: "edit",
        prompt: "Continue the scene.",
        promptVersion: "v1",
        quality: "low",
        references: [
          { ...rejected, provenance: { evidenceId: "attempt-rejected", kind: "provider-candidate", scope: "book-local" } } as never,
          place,
        ],
        requiredAnchors: [required(rejected), required(place)],
        size: "1024x1024",
      }),
    ).toThrow(/reference.*provenance|approved|exposed/i);
  });

  it("takes an immutable snapshot of reference bytes when compiling an edit", () => {
    const identity = reference("immutable-identity", "identity", "The reviewed recurring face");
    const place = reference("immutable-place", "place", "The reviewed room");
    const compiled = compileImageRequest({
      idempotencyKey: "immutable-edit",
      kind: "edit",
      prompt: "Continue the scene.",
      promptVersion: "v1",
      quality: "low",
      references: [identity, place],
      requiredAnchors: [required(identity), required(place)],
      size: "1024x1024",
    });

    identity.bytes[0] = 0;
    identity.description = "mutated after compilation";

    expect(sha256(compiled.references[0]!.bytes)).toBe(compiled.manifest.orderedReferences[0]!.digest);
    expect(compiled.references[0]!.description).toBe("The reviewed recurring face");
  });

  it("revalidates the compiled reference snapshot immediately before wire dispatch", async () => {
    const identity = reference("wire-identity", "identity", "The reviewed recurring face");
    const place = reference("wire-place", "place", "The reviewed room");
    const compiled = compileImageRequest({
      idempotencyKey: "wire-mutation",
      kind: "edit",
      prompt: "Continue the scene.",
      promptVersion: "v1",
      quality: "low",
      references: [identity, place],
      requiredAnchors: [required(identity), required(place)],
      size: "1024x1024",
    });
    compiled.references[0]!.bytes[0] = 0;
    const transport = vi.fn();
    const client = new OpenAiImageClient({ apiKey: "test", fetch: transport });

    await expect(
      client.execute(compiled, { clientRequestId: "adadadad-adad-4dad-8dad-adadadadadad" }),
    ).rejects.toThrow(/compiled image reference evidence/i);
    expect(transport).not.toHaveBeenCalled();
  });

  it("revalidates every fixed manifest invariant even when a caller recomputes public digests", async () => {
    const identity = reference("manifest-identity", "identity", "The reviewed recurring face");
    const place = reference("manifest-place", "place", "The reviewed room");
    const original = compileImageRequest({
      idempotencyKey: "coherent-manifest-mutation",
      kind: "edit",
      prompt: "Continue the scene.",
      promptVersion: "v1",
      quality: "low",
      references: [identity, place],
      requiredAnchors: [required(identity), required(place)],
      size: "1024x1024",
    });
    const transport = vi.fn();
    const client = new OpenAiImageClient({ apiKey: "test", fetch: transport });
    const mutations: Array<(compiled: typeof original) => void> = [
      (compiled) => {
        compiled.manifest.idempotencyKey = "";
      },
      (compiled) => {
        compiled.manifest.promptVersion = "";
      },
      (compiled) => {
        compiled.manifest.quality = "ultra" as never;
      },
      (compiled) => {
        compiled.manifest.moderation = "disabled" as never;
      },
      (compiled) => {
        compiled.manifest.background = "transparent" as never;
      },
      (compiled) => {
        compiled.manifest.outputFormat = "jpeg" as never;
      },
      (compiled) => {
        compiled.manifest.idempotencyScope = "provider-replay" as never;
      },
      (compiled) => {
        compiled.manifest.requiredAnchors = [];
      },
      (compiled) => {
        compiled.references = compiled.references.slice(0, 1);
        compiled.manifest.orderedReferences = compiled.manifest.orderedReferences.slice(0, 1);
        compiled.manifest.requiredAnchors = compiled.manifest.requiredAnchors.slice(0, 1);
      },
      (compiled) => {
        compiled.exactPrompt = "";
        compiled.manifest.exactPrompt = "";
        compiled.manifest.promptDigest = sha256("");
      },
    ];

    for (const mutate of mutations) {
      const compiled = structuredClone(original);
      mutate(compiled);
      compiled.manifestDigest = digestJson(compiled.manifest);
      await expect(
        client.execute(compiled, { clientRequestId: "dededede-dede-4ede-8ede-dededededede" }),
      ).rejects.toThrow(/compiled image request|manifest|anchor|reference|prompt/i);
    }
    expect(transport).not.toHaveBeenCalled();
  });

  it("caps the complete dispatched prompt after adding ordered reference guidance", () => {
    const identity = reference("long-identity", "identity", "x".repeat(20_000));
    const place = reference("long-place", "place", "y".repeat(20_000));

    expect(() =>
      compileImageRequest({
        idempotencyKey: "oversized-final-prompt",
        kind: "edit",
        prompt: "Continue the scene.",
        promptVersion: "v1",
        quality: "low",
        references: [identity, place],
        requiredAnchors: [required(identity), required(place)],
        size: "1024x1024",
      }),
    ).toThrow(/32,000|prompt.*exceed/i);
  });
});

describe("GPT Image 2 transport and replay", () => {
  it("rejects endpoint overrides before an authorization header can leave the official origin", () => {
    const transport = vi.fn();
    const unsafeOptions = {
      apiKey: "audit-sentinel-secret",
      baseUrl: "http://attacker.invalid",
      fetch: transport,
    };

    expect(() => new OpenAiImageClient(unsafeOptions)).toThrow(/unsupported.*option|baseUrl/i);
    expect(transport).not.toHaveBeenCalled();
  });

  it("sends generation without undocumented idempotency or input-fidelity fields and validates the PNG", async () => {
    const png = validPng(1024, 1024, [3, 5, 7]);
    const calls: Array<{ init?: RequestInit; url: string }> = [];
    const transport = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      calls.push({ ...(init === undefined ? {} : { init }), url: String(input) });
      return new Response(
        JSON.stringify({
          background: "opaque",
          data: [{ b64_json: Buffer.from(png).toString("base64") }],
          output_format: "png",
          quality: "low",
          size: "1024x1024",
          model: "untrusted-undocumented-response-echo",
          usage: {
            input_tokens: 12,
            input_tokens_details: { image_tokens: 0, text_tokens: 12 },
            output_tokens: 40,
            total_tokens: 52,
          },
        }),
        { headers: { "content-type": "application/json", "openai-processing-ms": "125", "x-request-id": "req_test" } },
      );
    });
    const client = new OpenAiImageClient({ apiKey: "secret-test-key", fetch: transport });
    const compiled = compileImageRequest({
      idempotencyKey: "transport-test",
      kind: "generate",
      prompt: "A plain ceramic cup on a scratched table.",
      promptVersion: "v1",
      quality: "low",
      size: "1024x1024",
    });

    const result = await client.execute(compiled, { clientRequestId: "11111111-1111-4111-8111-111111111111" });

    expect(calls).toHaveLength(1);
    expect(calls[0]?.url).toBe("https://api.openai.com/v1/images/generations");
    expect(calls[0]?.init?.redirect).toBe("error");
    expect(calls[0]?.init?.headers).not.toHaveProperty("Idempotency-Key");
    const body = JSON.parse(String(calls[0]?.init?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({ model: GPT_IMAGE_SNAPSHOT, n: 1, output_format: "png" });
    expect(body).not.toHaveProperty("input_fidelity");
    expect(result).toMatchObject({
      byteLength: png.byteLength,
      estimatedOutputCostMicrousd: 1_200,
      estimatedTotalCostMicrousd: 1_260,
      height: 1024,
      mediaType: "image/png",
      providerRequestId: "req_test",
      requestedModelSnapshot: GPT_IMAGE_SNAPSHOT,
      servedModelEvidence: "unavailable-from-image-api",
      totalCostEstimateUnavailableReason: null,
      width: 1024,
    });
    expect(result).not.toHaveProperty("servedModel");
    expect(result.digest).toBe(sha256(png));
  });

  it("sends edit reference blobs in manifest order and omits input_fidelity", async () => {
    const identity = reference("identity", "identity", "The recurring face");
    const neighbor = reference("neighbor", "causal-neighbor", "The previous moment");
    let form: FormData | undefined;
    let redirect: RequestRedirect | undefined;
    const client = new OpenAiImageClient({
      apiKey: "secret-test-key",
      fetch: vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        form = init?.body as FormData;
        redirect = init?.redirect;
        return new Response(
          JSON.stringify({ data: [{ b64_json: Buffer.from(validPng(1024, 1536, [11, 13, 17])).toString("base64") }] }),
          { headers: { "content-type": "application/json", "x-request-id": "req_edit" } },
        );
      }),
    });
    const compiled = compileImageRequest({
      idempotencyKey: "edit-transport-test",
      kind: "edit",
      prompt: "The recurring figure has put on a raincoat and crossed the street.",
      promptVersion: "v1",
      quality: "low",
      references: [identity, neighbor],
      requiredAnchors: [required(identity), required(neighbor)],
      size: "1024x1536",
    });

    await client.execute(compiled, { clientRequestId: "22222222-2222-4222-8222-222222222222" });

    expect(form?.getAll("image[]").map((entry) => (entry as File).name)).toEqual([
      "01-identity.png",
      "02-neighbor.png",
    ]);
    expect(redirect).toBe("error");
    expect(form?.has("input_fidelity")).toBe(false);
    expect(form?.get("model")).toBe(GPT_IMAGE_SNAPSHOT);
  });

  it("classifies moderation and ambiguous transport failures without a hidden retry", async () => {
    const compiled = compileImageRequest({
      idempotencyKey: "failure-test",
      kind: "generate",
      prompt: "A market receipt.",
      promptVersion: "v1",
      quality: "low",
      size: "1024x1024",
    });
    const moderationFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          error: {
            code: "moderation_blocked",
            moderation_details: { categories: ["harassment"], moderation_stage: "input" },
            type: "image_generation_user_error",
          },
        }),
        { headers: { "content-type": "application/json", "x-request-id": "req_blocked" }, status: 400 },
      ),
    );
    const moderationClient = new OpenAiImageClient({ apiKey: "test", fetch: moderationFetch });
    await expect(
      moderationClient.execute(compiled, { clientRequestId: "33333333-3333-4333-8333-333333333333" }),
    ).rejects.toMatchObject({
      code: "moderation_blocked",
      disposition: "rejected",
      latencyUnavailableReason: null,
      pricingVersion: "openai-standard-token-pricing-2026-07-19",
      totalCostEstimateUnavailableReason: "attempt-failed-before-usage",
    });
    expect(moderationFetch).toHaveBeenCalledTimes(1);

    const networkFetch = vi.fn(async () => {
      throw new Error("connection reset");
    });
    const networkClient = new OpenAiImageClient({ apiKey: "test", fetch: networkFetch });
    await expect(
      networkClient.execute(compiled, { clientRequestId: "44444444-4444-4444-8444-444444444444" }),
    ).rejects.toBeInstanceOf(ImageProviderError);
    await expect(
      networkClient.execute(compiled, { clientRequestId: "55555555-5555-4555-8555-555555555555" }),
    ).rejects.toMatchObject({ disposition: "indeterminate" });
    expect(networkFetch).toHaveBeenCalledTimes(2);
  });

  it("measures successful latency through body consumption and validation", async () => {
    let time = 0;
    const png = validPng(1024, 1024, [3, 5, 7]);
    const response = {
      headers: new Headers({ "x-request-id": "req_latency" }),
      ok: true,
      status: 200,
      text: async () => {
        time = 999;
        return JSON.stringify({ data: [{ b64_json: Buffer.from(png).toString("base64") }] });
      },
    } as Response;
    const client = new OpenAiImageClient({
      apiKey: "test",
      fetch: vi.fn(async () => {
        time = 10;
        return response;
      }),
      now: () => time,
    });
    const compiled = compileImageRequest({
      idempotencyKey: "latency-through-body",
      kind: "generate",
      prompt: "A market receipt.",
      promptVersion: "v1",
      quality: "low",
      size: "1024x1024",
    });

    await expect(
      client.execute(compiled, { clientRequestId: "bcbcbcbc-bcbc-4cbc-8cbc-bcbcbcbcbcbc" }),
    ).resolves.toMatchObject({ latencyMs: 999 });
  });

  it("classifies a response-body abort and every malformed successful response as indeterminate", async () => {
    const compiled = compileImageRequest({
      idempotencyKey: "malformed-success",
      kind: "generate",
      prompt: "A market receipt.",
      promptVersion: "v1",
      quality: "low",
      size: "1024x1024",
    });
    const bodyAbort = new OpenAiImageClient({
      apiKey: "test",
      fetch: vi.fn(async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              controller.error(new Error("body stream aborted"));
            },
          }),
          { headers: { "x-request-id": "req_body_abort" }, status: 200 },
        ),
      ),
    });
    await expect(
      bodyAbort.execute(compiled, { clientRequestId: "88888888-8888-4888-8888-888888888888" }),
    ).rejects.toMatchObject({ disposition: "indeterminate" });

    for (const [label, body] of [
      ["invalid-json", "{"],
      [
        "missing-idat",
        JSON.stringify({ data: [{ b64_json: Buffer.from(pngWithoutImageData(1024, 1024)).toString("base64") }] }),
      ],
      [
        "bad-crc",
        (() => {
          const corrupt = validPng(1024, 1024, [1, 2, 3]);
          corrupt[corrupt.byteLength - 5] = corrupt[corrupt.byteLength - 5]! ^ 0xff;
          return JSON.stringify({ data: [{ b64_json: Buffer.from(corrupt).toString("base64") }] });
        })(),
      ],
      [
        "trailing-zlib-byte",
        JSON.stringify({
          data: [{ b64_json: Buffer.from(pngWithTrailingCompressedByte(1024, 1024)).toString("base64") }],
        }),
      ],
      [
        "reserved-bit-chunk",
        JSON.stringify({
          data: [{ b64_json: Buffer.from(pngWithReservedBitChunk(1024, 1024)).toString("base64") }],
        }),
      ],
      [
        "transparency-after-image-data",
        JSON.stringify({
          data: [{ b64_json: Buffer.from(pngWithTransparencyAfterImageData(1024, 1024)).toString("base64") }],
        }),
      ],
      [
        "transparent-rgba",
        JSON.stringify({
          data: [{ b64_json: Buffer.from(transparentRgbaPng(1024, 1024)).toString("base64") }],
        }),
      ],
    ] as const) {
      const client = new OpenAiImageClient({
        apiKey: "test",
        fetch: vi.fn(async () => new Response(body, { headers: { "x-request-id": `req_${label}` }, status: 200 })),
      });
      await expect(
        client.execute(compiled, { clientRequestId: "99999999-9999-4999-8999-999999999999" }),
      ).rejects.toMatchObject({ disposition: "indeterminate" });
    }

    const inconsistentUsage = new OpenAiImageClient({
      apiKey: "test",
      fetch: vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [{ b64_json: Buffer.from(validPng(1024, 1024, [7, 11, 13])).toString("base64") }],
            usage: {
              input_tokens: 9,
              input_tokens_details: { image_tokens: 0, text_tokens: 8 },
              output_tokens: 40,
              total_tokens: 49,
            },
          }),
          { headers: { "x-request-id": "req_bad_usage" }, status: 200 },
        ),
      ),
    });
    await expect(
      inconsistentUsage.execute(compiled, { clientRequestId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }),
    ).rejects.toMatchObject({ disposition: "indeterminate" });

    const unsafeUsage = new OpenAiImageClient({
      apiKey: "test",
      fetch: vi.fn(async () => {
        const unsafe = Number.MAX_SAFE_INTEGER + 1;
        return new Response(
          JSON.stringify({
            data: [{ b64_json: Buffer.from(validPng(1024, 1024, [5, 7, 11])).toString("base64") }],
            usage: {
              input_tokens: unsafe,
              input_tokens_details: { image_tokens: 0, text_tokens: unsafe },
              output_tokens: 0,
              total_tokens: unsafe,
            },
          }),
          { headers: { "x-request-id": "req_unsafe_usage" }, status: 200 },
        );
      }),
    });
    await expect(
      unsafeUsage.execute(compiled, { clientRequestId: "cdcdcdcd-cdcd-4dcd-8dcd-cdcdcdcdcdcd" }),
    ).rejects.toMatchObject({ disposition: "indeterminate" });

    const timeout = new OpenAiImageClient({
      apiKey: "test",
      fetch: vi.fn(async () => new Response("upstream timed out", { status: 408 })),
    });
    await expect(
      timeout.execute(compiled, { clientRequestId: "abababab-abab-4bab-8bab-abababababab" }),
    ).rejects.toMatchObject({ disposition: "indeterminate", httpStatus: 408 });

    const duplicatePalette = new OpenAiImageClient({
      apiKey: "test",
      fetch: vi.fn(async () =>
        new Response(
          JSON.stringify({
            data: [{ b64_json: Buffer.from(indexedPngWithDuplicatePalette(1024, 1024)).toString("base64") }],
          }),
          { headers: { "x-request-id": "req_duplicate_palette" }, status: 200 },
        ),
      ),
    });
    await expect(
      duplicatePalette.execute(compiled, { clientRequestId: "acacacac-acac-4cac-8cac-acacacacacac" }),
    ).rejects.toMatchObject({ disposition: "indeterminate" });

    for (const [label, png] of [
      ["oversized-palette", indexedPngWithOversizedPalette(1024, 1024)],
      ["out-of-range-palette-sample", indexedPngWithOutOfRangeSample(1024, 1024)],
    ] as const) {
      const invalidIndexed = new OpenAiImageClient({
        apiKey: "test",
        fetch: vi.fn(async () =>
          new Response(JSON.stringify({ data: [{ b64_json: Buffer.from(png).toString("base64") }] }), {
            headers: { "x-request-id": `req_${label}` },
            status: 200,
          }),
        ),
      });
      await expect(
        invalidIndexed.execute(compiled, { clientRequestId: "afafafaf-afaf-4faf-8faf-afafafafafaf" }),
      ).rejects.toMatchObject({ disposition: "indeterminate" });
    }
  });

  it("sanitizes generated bytes out of replay fixtures and rejects manifest mismatch", async () => {
    const compiled = compileImageRequest({
      idempotencyKey: "replay-test",
      kind: "generate",
      prompt: "A folded paper map.",
      promptVersion: "v1",
      quality: "low",
      size: "1024x1024",
    });
    const png = validPng(1024, 1024, [19, 23, 29]);
    const fixture = sanitizeImageResult(compiled, {
      byteLength: png.byteLength,
      bytes: png,
      clientRequestId: "66666666-6666-4666-8666-666666666666",
      digest: sha256(png),
      estimatedOutputCostMicrousd: 6_000,
      estimatedTotalCostMicrousd: null,
      height: 1024,
      latencyMs: 250,
      mediaType: "image/png",
      pricingVersion: "openai-standard-token-pricing-2026-07-19",
      providerProcessingMs: 125,
      providerRequestId: "req_replay",
      requestedModelSnapshot: GPT_IMAGE_SNAPSHOT,
      servedModelEvidence: "unavailable-from-image-api",
      totalCostEstimateUnavailableReason: "usage-unavailable",
      usage: null,
      width: 1024,
      secretBearer: "sk-must-not-enter-replay",
    } as never);

    expect(JSON.stringify(fixture)).not.toContain(Buffer.from(png).toString("base64"));
    expect(JSON.stringify(fixture)).not.toContain("secretBearer");
    expect(JSON.stringify(fixture)).not.toContain("sk-must-not-enter-replay");
    expect(replayImageResult(compiled, fixture)).toEqual(fixture.result);
    const changed = compileImageRequest({
      idempotencyKey: "replay-test",
      kind: "generate",
      prompt: "A different map.",
      promptVersion: "v1",
      quality: "low",
      size: "1024x1024",
    });
    expect(() => replayImageResult(changed, fixture)).toThrow(/manifest.*digest/i);

    for (const mutation of [
      { digest: "0".repeat(64) },
      { providerRequestId: "req_changed" },
      { pricingVersion: "fabricated-pricing-version" },
      { estimatedOutputCostMicrousd: 1 },
      { usage: { input_tokens: 1, input_tokens_details: { image_tokens: 0, text_tokens: 1 }, output_tokens: 1, total_tokens: 2 } },
    ]) {
      const tampered = structuredClone(fixture);
      Object.assign(tampered.result, mutation);
      expect(() => replayImageResult(compiled, tampered)).toThrow(/result|fixture.*digest/i);
    }
  });
});
