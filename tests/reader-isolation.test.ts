import { expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

it("keeps resume, bookmarks, pending openings and guide dismissal separate for two reader profiles across reloads", async () => {
  const directory = await mkdtemp(join(tmpdir(), "shape-reader-profiles-"));
  const run = (profile: string, body: string) => {
    const result = spawnSync(process.execPath, ["--experimental-webstorage", "--localstorage-file=" + join(directory, profile), "--import", "tsx", "--input-type=module", "-e", `
      import assert from 'node:assert/strict';
      import {selectReadingEdition,enter,loadReading,saveReading} from './src/client/visits.ts';
      import {hasSeenReadingGuide,rememberReadingGuide} from './src/client/tour-state.ts';
      selectReadingEdition('same-shared-book'); ${body}
    `], { encoding: "utf8" });
    expect(result.status, result.stderr).toBe(0);
  };
  try {
    run("reader-a", `const id=enter('root',null); const state=loadReading(); state.bookmarks.root={publicationId:'a-page',blockId:'a-block'}; state.requests.a={intentId:'a-request',visitId:id}; saveReading(state); rememberReadingGuide();`);
    run("reader-b", `assert.equal(loadReading().current,null); assert.deepEqual(loadReading().bookmarks,{}); assert.deepEqual(loadReading().requests,{}); assert.equal(hasSeenReadingGuide(),false); enter('child',null);`);
    run("reader-a", `const state=loadReading(); assert.equal(state.visits[state.current].workId,'root'); assert.equal(state.bookmarks.root.publicationId,'a-page'); assert.equal(state.requests.a.intentId,'a-request'); assert.equal(hasSeenReadingGuide(),true);`);
    run("reader-b", `const state=loadReading(); assert.equal(state.visits[state.current].workId,'child'); assert.deepEqual(state.bookmarks,{}); assert.deepEqual(state.requests,{}); assert.equal(hasSeenReadingGuide(),false);`);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
