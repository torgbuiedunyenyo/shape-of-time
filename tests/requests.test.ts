import { expect, it } from "vitest";
import { explorationKey } from "../src/client/requests.js";

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
