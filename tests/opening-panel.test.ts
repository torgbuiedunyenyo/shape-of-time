import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { OpeningPanel } from "../src/client/OpeningPanel.js";
import type { Intent } from "../src/shared/types.js";
const source = { publicationId: "source-publication", blockId: "source-block" };
const request: Intent = { id: "request", kind: "explore", status: "queued", work_id: "parent", result_work_id: null, payload: {}, error: null };
function panel(intent?: Intent) {
  return renderToStaticMarkup(createElement(OpeningPanel, { source, intent, onClose() {}, onRequest() {}, onEnter() {} }));
}
it("offers source exploration without an input for directing the narrative", () => {
  expect(panel()).not.toContain("<input");
  expect(panel()).toContain("Open as a book");
});
it("distinguishes a queued opening from one whose first passage is being written", () => {
  expect(panel(request)).toContain("Waiting to begin");
  expect(panel({ ...request, status: "running" })).toContain("The first passage is taking shape");
});
it("offers a usable way back to reading while an opening waits, and does not offer a duplicate retry after a provider pause", () => {
  for (const status of ["queued", "running", "paused", "failed"]) {
    const html = panel({ ...request, status });
    expect(html).toContain("Keep reading");
    expect(html).not.toContain("disabled=");
    expect(html).not.toContain("Open as a book ↗");
  }
  expect(panel({ ...request, queue: { ahead: 3, blocked: false } })).toContain("waiting its turn");
  expect(panel({ ...request, queue: { ahead: 3, blocked: true } })).toContain("New writing is paused");
});
it("enables entry as soon as the first publication is readable while generation continues", () => {
  const html = panel({ ...request, status: "running", result_work_id: "child", latest_publication_id: "first-publication" });
  expect(html).toContain("Enter the book");
  expect(html).not.toContain("disabled=");
  expect(html).toContain("The opening is ready to read");
});
