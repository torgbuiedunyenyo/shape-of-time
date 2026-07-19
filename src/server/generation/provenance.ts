import type { AssetStore } from "../assets/asset-store.js";
import type { JsonValue } from "../db/types.js";
import { sha256 } from "../domain/digests.js";
import type { LibraryRepository } from "../repositories/library-repository.js";

/**
 * D4: provenance reconstruction from primary records only (PLAN §D4). Everything here is read
 * back from the five domain tables and the asset store and re-verified by digest — no derived
 * development artifact participates. A folio whose attempt carries no provenance manifest is
 * refused outright: generated prose without lineage is never silently promoted to canon.
 */
export const PROVENANCE_VERSION = "shape-of-time.provenance.v1";

export interface ReconstructedProvenance {
  readonly attempt: {
    readonly providerRequestId: string;
    readonly usage: { readonly [key: string]: JsonValue };
  };
  readonly context: {
    readonly contextDigest: string;
    readonly promptVersion: string;
    readonly sourceDigests: { readonly [key: string]: string };
  };
  readonly dormant: {
    readonly reason: string;
    readonly visualProfile: JsonValue;
  };
  readonly folio: { readonly id: string; readonly proseDigestVerified: boolean };
  readonly image: {
    readonly assetId: string;
    readonly digestVerified: boolean;
  };
  readonly priorFolios: readonly {
    readonly folioId: string;
    readonly ordinal: number;
    readonly proseDigestVerified: boolean;
  }[];
  readonly verified: boolean;
}

function requireString(value: JsonValue | undefined, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`provenance manifest is missing ${label}; the derivation cannot be reconstructed`);
  }
  return value;
}

export async function reconstructFolioProvenance(
  dependencies: { assetStore: AssetStore; repository: LibraryRepository },
  folioId: string,
): Promise<ReconstructedProvenance> {
  const { assetStore, repository } = dependencies;
  const folio = await repository.getFolio(folioId);
  const evidence = await repository.getAttemptEvidence(folioId);

  const manifest = evidence.result;
  if (manifest === null || manifest["provenanceVersion"] !== PROVENANCE_VERSION) {
    throw new Error(
      `folio ${folioId} has no generation lineage: its attempt records no provenance manifest, ` +
        "and unprovenanced prose is never promoted to canon",
    );
  }
  if (evidence.usage === null || evidence.providerRequestId === null) {
    throw new Error(`folio ${folioId} lineage is incomplete: usage or provider request id missing`);
  }

  const proseDigest = requireString(manifest["proseDigest"], "proseDigest");
  const proseDigestVerified = folio.prose !== null && sha256(folio.prose) === proseDigest;

  const imageAssetId = requireString(manifest["imageAssetId"], "imageAssetId");
  const imageDigest = requireString(manifest["imageDigest"], "imageDigest");
  if (!folio.requiredAssetIds.includes(imageAssetId)) {
    throw new Error(`folio ${folioId} does not require its recorded image asset ${imageAssetId}`);
  }
  const asset = await repository.getAsset(imageAssetId);
  const bytes = await assetStore.get(asset.objectKey);
  const digestVerified = sha256(bytes) === imageDigest && asset.digest === imageDigest;

  const recordedPriors = Array.isArray(manifest["priorFolios"])
    ? (manifest["priorFolios"] as readonly { [key: string]: JsonValue }[])
    : [];
  const priorFolios = await Promise.all(
    recordedPriors.map(async (prior) => {
      const priorId = requireString(prior["folioId"], "priorFolios[].folioId");
      const priorDigest = requireString(prior["proseDigest"], "priorFolios[].proseDigest");
      const ordinal = prior["ordinal"];
      if (typeof ordinal !== "number") {
        throw new Error("provenance manifest prior folio is missing its ordinal");
      }
      const record = await repository.getFolio(priorId);
      return {
        folioId: priorId,
        ordinal,
        proseDigestVerified: record.prose !== null && sha256(record.prose) === priorDigest,
      };
    }),
  );

  const sourceDigestsRaw = manifest["sourceDigests"];
  if (sourceDigestsRaw === null || typeof sourceDigestsRaw !== "object" || Array.isArray(sourceDigestsRaw)) {
    throw new Error("provenance manifest is missing its source digests");
  }
  const sourceDigests: { [key: string]: string } = {};
  for (const [key, value] of Object.entries(sourceDigestsRaw)) {
    sourceDigests[key] = requireString(value, `sourceDigests.${key}`);
  }

  const dormantRaw = manifest["dormant"];
  const dormant =
    dormantRaw !== null && typeof dormantRaw === "object" && !Array.isArray(dormantRaw)
      ? {
          reason: requireString(dormantRaw["reason"], "dormant.reason"),
          visualProfile: dormantRaw["visualProfile"] ?? null,
        }
      : { reason: "dormant slots absent from manifest", visualProfile: null };

  const verified =
    proseDigestVerified && digestVerified && priorFolios.every((prior) => prior.proseDigestVerified);
  return {
    attempt: { providerRequestId: evidence.providerRequestId, usage: evidence.usage },
    context: {
      contextDigest: requireString(manifest["contextDigest"], "contextDigest"),
      promptVersion: requireString(manifest["promptVersion"], "promptVersion"),
      sourceDigests,
    },
    dormant,
    folio: { id: folio.id, proseDigestVerified },
    image: { assetId: imageAssetId, digestVerified },
    priorFolios,
    verified,
  };
}
