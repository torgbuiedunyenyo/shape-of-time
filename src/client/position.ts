import type { Anchor } from "../shared/types.js";
export type ReadingPlace = { place: Anchor; pixelOffset: number };
function rangeAt(element: HTMLElement, offset: number) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode(),
    left = offset;
  while (node) {
    const length = node.textContent?.length ?? 0;
    if (left < length) {
      const range = document.createRange();
      range.setStart(node, left);
      range.setEnd(node, Math.min(left + 1, length));
      return range;
    }
    left -= length;
    node = walker.nextNode();
  }
  return null;
}
export function capturePlace(
  root: HTMLElement,
  viewportLine = 100,
): ReadingPlace | undefined {
  const block = Array.from(
    root.querySelectorAll<HTMLElement>("[data-block]"),
  ).find((b) => b.getBoundingClientRect().bottom > viewportLine);
  if (!block) return;
  const base = { publicationId: block.dataset.publication!, blockId: block.id };
  if (block.tagName === "FIGURE" || block.tagName === "HR")
    return {
      place: base,
      pixelOffset: block.getBoundingClientRect().top - viewportLine,
    };
  let low = 0,
    high = Math.max(0, (block.textContent?.length ?? 1) - 1);
  while (low < high) {
    const mid = Math.floor((low + high) / 2),
      rect = rangeAt(block, mid)?.getBoundingClientRect();
    if (rect && rect.bottom > viewportLine) high = mid;
    else low = mid + 1;
  }
  const rect = rangeAt(block, low)?.getBoundingClientRect();
  return {
    place: { ...base, offset: low },
    pixelOffset:
      (rect?.top ?? block.getBoundingClientRect().top) - viewportLine,
  };
}
export function restorePlace(
  root: HTMLElement,
  saved: ReadingPlace,
  viewportLine = 100,
) {
  const block = Array.from(
    root.querySelectorAll<HTMLElement>("[data-block]"),
  ).find((b) => b.id === saved.place.blockId);
  if (!block) return;
  const rect =
    saved.place.offset === undefined
      ? block.getBoundingClientRect()
      : rangeAt(block, saved.place.offset)?.getBoundingClientRect();
  if (rect) window.scrollBy(0, rect.top - viewportLine - saved.pixelOffset);
}
