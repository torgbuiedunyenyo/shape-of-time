import { expect, it } from "vitest";
import { explorationKey, requestNeedsPolling } from "../src/client/requests.js";
import { bookmarkedVisit, latestVisitRequests, sourceReturn } from "../src/client/visits.js";

it("keeps observing a saved paused or failed request so recovery becomes visible without a duplicate submission", () => {
  for (const status of ["queued", "running", "failed", "paused"]) expect(requestNeedsPolling(status)).toBe(true);
  for (const status of ["done", "cancelled"]) expect(requestNeedsPolling(status)).toBe(false);
});

it("retains a pending continuation while the reader selects or opens another source", () => {
  const continuation = { intentId: "continue-root", visitId: "root-visit" };
  const source = { publicationId: "root-publication", blockId: "image" };
  const opening = { intentId: "explore-image", visitId: "root-visit", source };
  expect(latestVisitRequests({ continuation, opening }, "root-visit")).toEqual({ continuation, opening });
  expect(latestVisitRequests({ opening, continuation }, "root-visit")).toEqual({ continuation, opening });
  expect(latestVisitRequests({ opening, continuation }, "another-visit")).toEqual({ continuation: undefined, opening: undefined });
});

it("reopens a bookmark through its own nested visit even after another route reaches the same work", () => {
  const entry = { publicationId: "parent-publication", blockId: "program", offset: 91 };
  const first = { id: "wedding-via-program", workId: "wedding", parentId: "lounge-visit", entry };
  const second = { id: "wedding-via-photo", workId: "wedding", parentId: "photo-visit", entry: { ...entry, blockId: "portrait" } };
  const place = { publicationId: "wedding-publication", blockId: "ceremony", offset: 144 };
  const visits = { [first.id]: first, [second.id]: second };
  const result = bookmarkedVisit("wedding", { ...place, visitId: first.id }, visits);
  expect(result).toEqual({ ...first, place, pixelOffset: 0 });
  expect(sourceReturn(result.entry)?.place).toEqual(entry);
  expect(bookmarkedVisit("wedding", { ...place, visitId: second.id }, visits).parentId).toBe("photo-visit");
});

it("keeps long cross-paragraph selections inside the request-key limit without conflating distinct openings", async () => {
  const source = {
    publicationId: "publication",
    blockId: "first",
    offset: 12,
    endBlockId: "last",
    endOffset: 8,
    quote: "A selected passage. ".repeat(250),
  };
  const key = await explorationKey("visit-one", source);
  expect(key.length).toBeLessThanOrEqual(300);
  expect(await explorationKey("visit-one", { ...source })).toBe(key);
  expect(await explorationKey("visit-two", source)).not.toBe(key);
  expect(
    await explorationKey("visit-one", { ...source, offset: 13 }),
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
