export type Inline = {
  kind: "text" | "em" | "strong" | "code" | "break";
  text?: string;
  children?: Inline[];
};
export type Block = {
  id: string;
  kind:
    "paragraph" | "heading" | "quote" | "list" | "figure" | "break" | "code";
  text: string;
  inline?: Inline[];
  level?: number;
  items?: Inline[][];
  ordered?: boolean;
  assetId?: string;
  caption?: string;
};
export type Anchor = {
  publicationId: string;
  blockId: string;
  offset?: number;
  endBlockId?: string;
  endOffset?: number;
  quote?: string;
  assetId?: string;
  region?: { x: number; y: number; width: number; height: number };
};
export type Work = {
  id: string;
  edition_id: string;
  title: string;
  founding: Record<string, unknown>;
  created_at: string;
};
export type Publication = {
  id: string;
  work_id: string;
  ordinal: number;
  document_id: string;
  blocks: Block[];
  created_at: string;
};
export type Intent = {
  id: string;
  kind: string;
  status: string;
  work_id: string | null;
  result_work_id: string | null;
  payload: Record<string, unknown>;
  error: string | null;
};
export type Book = {
  work: Work;
  publications: Publication[];
  openings: {
    id: string;
    source: Anchor;
    target_work_id: string;
    label: string;
  }[];
  pending: Intent[];
};
