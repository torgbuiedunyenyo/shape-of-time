import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { config } from "./config.js";

export type Mechanism = {
  hash: string;
  files: Record<string, string>;
  configuration: {
    textModel: string;
    effort: string;
    imageModel: string;
    preparationEnabled: boolean;
    contextRenewalTokens: number;
  };
  revision: string | null;
};
export const digest = (value: string | Uint8Array) =>
  createHash("sha256").update(value).digest("hex");

/** Record the implementation and artistic inputs, never environment secrets or development evidence. */
export async function mechanismFiles() {
  const files: Record<string, string> = {};
  async function visit(directory: string) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await visit(path);
      else if (entry.name.endsWith(".ts") || entry.name.endsWith(".md"))
        files[path] = digest(await readFile(path));
    }
  }
  await visit("src/server");
  await visit("src/shared");
  await visit("prompts");
  for (const name of ["world", "world-essence", "prose-guide", "visual-direction"])
    files[`content/shape-of-time/${name}.md`] = digest(await readFile(`content/shape-of-time/${name}.md`));
  // The lock also records transitive provider, image and persistence dependencies.
  files["pnpm-lock.yaml"] = digest(await readFile("pnpm-lock.yaml"));
  files[".nvmrc"] = digest(await readFile(".nvmrc"));
  return files;
}
let fileRecord: Promise<Record<string, string>> | undefined;
export async function currentMechanism(): Promise<Mechanism> {
  // Production reads the build's record, never requires its source checkout at runtime.
  fileRecord ??= import.meta.url.endsWith(".ts")
    ? mechanismFiles()
    : readFile(new URL("../mechanism.json", import.meta.url), "utf8").then(JSON.parse);
  const files = await fileRecord;
  const configuration = {
    textModel: config.textModel,
    effort: config.effort,
    imageModel: config.imageModel,
    preparationEnabled: config.preparationEnabled,
    contextRenewalTokens: config.contextRenewalTokens,
  };
  return {
    hash: digest(JSON.stringify({ files, configuration })),
    files,
    configuration,
    revision: process.env.RAILWAY_GIT_COMMIT_SHA ?? null,
  };
}

export function mechanismMatches(pinned: Mechanism | null, current: Mechanism) {
  return !pinned || pinned.hash === current.hash;
}
