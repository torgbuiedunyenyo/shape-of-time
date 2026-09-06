import { expect, it } from "vitest";
import { explorationKey } from "../src/client/requests.js";
import { sourceReturn } from "../src/client/visits.js";

it("keeps long cross-paragraph selections inside the request-key limit without conflating distinct openings", async () => {
  const source = {
    publicationId: "publication",
    blockId: "first",
    offset: 12,
    endBlockId: "last",
    endOffset: 8,
    quote: "A selected passage. ".repeat(250),
  };
  const key = await explorationKey("visit-one", source, "");
  expect(key.length).toBeLessThanOrEqual(300);
  expect(await explorationKey("visit-one", { ...source }, "")).toBe(key);
  expect(await explorationKey("visit-two", source, "")).not.toBe(key);
  expect(
    await explorationKey("visit-one", source, "A different direction"),
  ).not.toBe(key);
  expect(
    await explorationKey("visit-one", { ...source, offset: 13 }, ""),
  ).not.toBe(key);
});

it("returns the same nested work to each visit's own source, including the selected point within an image", () => {
  const visit = {
    id: "first-visit",
    workId: "shared-child",
    parentId: "parent-visit",
  };
  const first = {
    publicationId: "root-publication",
    blockId: "first-passage",
    offset: 37,
  };
  const second = {
    publicationId: "root-publication",
    blockId: "later-image",
    assetId: "image",
    region: { x: 0.2, y: 0.3, width: 0.4, height: 0.2 },
  };
  expect(sourceReturn({ ...visit, entry: first }.entry)).toEqual({
    place: first,
    pixelOffset: 0,
  });
  expect(
    sourceReturn({ ...visit, id: "second-visit", entry: second }.entry),
  ).toEqual({ place: { ...second, imageFraction: 0.4 }, pixelOffset: 0 });
  expect(sourceReturn(undefined)).toBeUndefined();
});
