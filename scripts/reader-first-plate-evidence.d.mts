export type ReaderFirstPlateId =
  | "plate-root-payment"
  | "plate-root-band"
  | "plate-root-map"
  | "plate-map-terminal-wall";

export interface SharedReaderFirstPlateContract {
  applicationGuidance: string;
  bookId: string;
  folioId: string;
  idempotencyKey: string;
  referenceRules: readonly {
    assetId: string;
    digest?: string;
    kind: "exposed-folio-image" | "human-approved-medium";
    role: string;
    scope: "book-local" | "shared-medium-only";
    sourcePlateId?: ReaderFirstPlateId;
  }[];
}

export interface TrustedReaderFirstPlateEvidence {
  acceptanceSha256: string;
  plateId: ReaderFirstPlateId;
  providerOutputSha256: string;
}

export function readerFirstPlateContract(
  plateId: ReaderFirstPlateId,
): SharedReaderFirstPlateContract;

export function readerFirstPlatePrompt(
  plateId: ReaderFirstPlateId,
  imageDirection: unknown,
): {
  applicationGuidance: string;
  applicationGuidanceSha256: string;
  canonicalDirection: string;
  exactSourcePrompt: string;
  fableImageDirectionSha256: string;
};

export function verifyReaderFirstPlateEvidence(input: {
  authoringRoot: string;
  candidate: unknown;
  candidateSha256: string;
  imageBytes: Uint8Array;
  imagePath: string;
  plateId: ReaderFirstPlateId;
  providerReceiptBytes: Uint8Array;
  providerReceiptPath: string;
  trustedPlateEvidence?: readonly TrustedReaderFirstPlateEvidence[];
}): Promise<void>;
