import { expect, test } from "@playwright/test";

test("a fresh reader completes the file-backed reader-first journey without runtime generation", async ({
  page,
}) => {
  const runtimeRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api" || url.pathname.startsWith("/api/") || url.origin !== "http://127.0.0.1:4173") {
      runtimeRequests.push(url.href);
    }
  });

  await page.goto("/library");
  await expect(page).toHaveTitle("Shape of Time");
  await expect(page.getByRole("heading", { name: "Your library" })).toBeVisible();

  await page.getByRole("button", { name: "Open Shape of Time" }).click();
  await expect(page).toHaveURL(/\/books\/shape-of-time\/folios\/root-folio-01$/u);
  await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();

  await page.getByRole("button", { name: "Next folio" }).click();
  await expect(page.getByRole("heading", { name: "The gift" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "The band" })).toBeVisible();

  for (let ordinal = 4; ordinal <= 7; ordinal += 1) {
    await page.getByRole("button", { name: "Next folio" }).click();
  }
  const aperture = page.getByRole("button", { name: "Open The maps were always becoming wrong" });
  await expect(aperture).toBeVisible();
  await expect(aperture).toHaveText("The maps were always becoming wrong.");
  await aperture.click();

  await expect(page.getByRole("heading", { name: "The licensed route" })).toBeVisible();
  await page.getByRole("button", { name: "Next folio" }).click();
  await expect(page.getByRole("heading", { name: "The terminal wall" })).toBeVisible();

  await page.reload();
  const historyLengthBeforeReturn = await page.evaluate(() => window.history.length);
  await page.getByRole("button", { name: "Back to passage" }).click();
  await expect(page).toHaveURL(/\/books\/shape-of-time\/folios\/root-folio-07$/u);
  await expect(aperture).toBeFocused();
  await expect(aperture).toBeInViewport();
  expect(await page.evaluate(() => window.history.length)).toBe(historyLengthBeforeReturn);

  await page.getByRole("button", { name: "Next folio" }).click();
  await expect(page.getByRole("heading", { name: "Jay says yes" })).toBeVisible();

  await page.getByRole("button", { name: "Bookmark this folio" }).click();
  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.getByRole("searchbox", { name: "Filter books" }).fill("Map on the Wall");
  await expect(page.getByRole("heading", { name: "The Map on the Wall" })).toBeVisible();

  await page.getByRole("searchbox", { name: "Filter books" }).fill("A Book That Is Not Here");
  await page.getByRole("button", { name: "Create a book called A Book That Is Not Here" }).click();
  await expect(page.getByRole("dialog")).toContainText("No book was created and no request was sent");
  await page.getByRole("button", { name: "Close" }).click();

  await page.reload();
  await page.getByRole("button", { name: "Resume Jay says yes" }).click();
  await expect(page).toHaveURL(
    /\/books\/shape-of-time\/folios\/root-folio-08#root-folio-08-block-01$/u,
  );
  expect(runtimeRequests).toEqual([]);
});

test("buttons, arrows, and a touch swipe agree on one folio sequence", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/books/shape-of-time/folios/root-folio-01");

  await page.getByRole("button", { name: "Next folio" }).click();
  await expect(page.getByRole("heading", { name: "The gift" })).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("heading", { name: "The band" })).toBeVisible();

  const folio = page.locator("[data-folio-id='root-folio-03']");
  await folio.dispatchEvent("pointerdown", {
    clientX: 330,
    clientY: 400,
    pointerId: 9,
    pointerType: "touch",
  });
  await folio.dispatchEvent("pointerup", {
    clientX: 70,
    clientY: 410,
    pointerId: 9,
    pointerType: "touch",
  });
  await expect(page.getByRole("heading", { name: "Your tomorrow or mine" })).toBeVisible();

  await page.getByRole("button", { name: "Previous folio" }).click();
  await expect(page.getByRole("heading", { name: "The band" })).toBeVisible();
});

test("a cross-paragraph selection stays in the reader and opens an honest confirmation", async ({
  page,
}) => {
  const runtimeRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api" || url.pathname.startsWith("/api/") || url.origin !== "http://127.0.0.1:4173") {
      runtimeRequests.push(url.href);
    }
  });
  await page.goto("/books/shape-of-time/folios/root-folio-01");

  const selectedText = await page.evaluate(() => {
    const paragraphs = [...document.querySelectorAll<HTMLElement>("[data-reader-prose] [data-block-id]")];
    const first = paragraphs[0];
    const second = paragraphs[1];
    if (first?.firstChild === null || second?.firstChild === null || first === undefined || second === undefined) {
      throw new Error("reader prose blocks are missing");
    }
    const range = document.createRange();
    range.setStart(first.firstChild, 4);
    range.setEnd(second.firstChild, 24);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    document.dispatchEvent(new Event("selectionchange"));
    return selection?.toString() ?? "";
  });

  const toolbar = page.getByRole("toolbar", { name: "Selected passage actions" });
  await expect(toolbar).toBeVisible();
  await toolbar.getByRole("button", { name: "Open as a book" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText(selectedText.slice(0, 36));
  await expect(dialog).toContainText("No book was created and no request was sent");
  await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  expect(runtimeRequests).toEqual([]);
});

test("mobile reflow, touch targets, focus, and reduced motion remain usable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/books/shape-of-time/folios/root-folio-07");

  const geometry = await page.evaluate(() => {
    const visibleControls = [...document.querySelectorAll<HTMLElement>("button, a")].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    return {
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      undersized: visibleControls
        .filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        })
        .map((element) => element.getAttribute("aria-label") ?? element.textContent?.trim() ?? element.tagName),
      transitionDuration: getComputedStyle(document.querySelector(".reading-folio") as Element)
        .transitionDuration,
    };
  });

  expect(geometry.documentWidth).toBeLessThanOrEqual(geometry.viewportWidth);
  expect(geometry.undersized).toEqual([]);
  expect(Number.parseFloat(geometry.transitionDuration)).toBeLessThanOrEqual(0.001);

  const aperture = page.getByRole("button", { name: "Open The maps were always becoming wrong" });
  await aperture.focus();
  await expect(aperture).toBeFocused();
  await expect(aperture).toBeInViewport();
});

test("resume restores the stable block position rather than only the folio", async ({ page }) => {
  await page.goto("/books/shape-of-time/folios/root-folio-01");
  const secondBlock = page.locator("[data-block-id='root-folio-01-block-02']");
  await secondBlock.evaluate((element) => element.scrollIntoView({ block: "center" }));
  await expect(secondBlock).toBeInViewport();

  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Resume Payment" }).click();

  await expect(page).toHaveURL(/root-folio-01#root-folio-01-block-02$/u);
  await expect(secondBlock).toBeFocused();
  await expect(secondBlock).toBeInViewport();
});

test("an aperture return never leaks from its child into an unrelated root visit", async ({ page }) => {
  await page.goto("/books/shape-of-time/folios/root-folio-07");
  await page.getByRole("button", { name: "Open The maps were always becoming wrong" }).click();
  await expect(page.getByRole("heading", { name: "The licensed route" })).toBeVisible();

  await page.getByRole("link", { name: "Library", exact: true }).click();
  await page.getByRole("button", { name: "Open Shape of Time" }).click();

  await expect(page.getByRole("heading", { name: "Payment" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Back to passage" })).toHaveCount(0);
});

test("Previous then Next reuses browser history instead of pushing a duplicate", async ({ page }) => {
  await page.goto("/books/shape-of-time/folios/root-folio-02");
  await page.getByRole("button", { name: "Previous folio" }).click();
  await expect(page).toHaveURL(/root-folio-01$/u);
  const historyLength = await page.evaluate(() => window.history.length);

  await page.getByRole("button", { name: "Next folio" }).click();
  await expect(page).toHaveURL(/root-folio-02$/u);
  expect(await page.evaluate(() => window.history.length)).toBe(historyLength);

  await page.goForward();
  await expect(page).toHaveURL(/root-folio-01$/u);
  await page.goBack();
  await expect(page).toHaveURL(/root-folio-02$/u);
});

test("the disconnected creation state is modal and page-turn keys cannot act behind it", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("searchbox", { name: "Filter books" }).fill("Unwritten Weather");
  await page.getByRole("button", { name: "Create a book called Unwritten Weather" }).click();

  const close = page.getByRole("button", { name: "Close" });
  await expect(close).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(close).toBeFocused();

  const url = page.url();
  await page.keyboard.press("ArrowRight");
  expect(page.url()).toBe(url);
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("cancelled and interactive-origin gestures never turn a folio", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/books/shape-of-time/folios/root-folio-01");
  const folio = page.locator("[data-folio-id='root-folio-01']");

  await folio.dispatchEvent("pointerdown", { clientX: 330, clientY: 400, pointerId: 11, pointerType: "touch" });
  await folio.dispatchEvent("pointercancel", { pointerId: 11, pointerType: "touch" });
  await folio.dispatchEvent("pointerup", { clientX: 70, clientY: 405, pointerId: 11, pointerType: "touch" });
  await expect(page).toHaveURL(/root-folio-01$/u);

  const next = page.getByRole("button", { name: "Next folio" });
  await next.dispatchEvent("pointerdown", { clientX: 300, clientY: 700, pointerId: 12, pointerType: "touch" });
  await next.dispatchEvent("pointerup", { clientX: 60, clientY: 705, pointerId: 12, pointerType: "touch" });
  await expect(page).toHaveURL(/root-folio-01$/u);
});

test("the 320px reader exposes bookmark state and keeps the dialog reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto("/books/shape-of-time/folios/root-folio-01");
  const bookmark = page.getByRole("button", { name: "Bookmark this folio" });
  await bookmark.click();
  await expect(page.getByRole("button", { name: "Remove bookmark" })).toHaveAttribute("aria-pressed", "true");
  const marker = await page.getByRole("button", { name: "Remove bookmark" }).evaluate((element) =>
    getComputedStyle(element, "::before").content,
  );
  expect(marker).toContain("◆");

  await page.getByRole("link", { name: "Library home" }).click();
  await page.getByRole("searchbox", { name: "Filter books" }).fill("Small Room");
  await page.getByRole("button", { name: "Create a book called Small Room" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeInViewport();
  await expect(dialog.getByRole("button", { name: "Close" })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
});

test("a client-side valid-to-invalid route transition returns safely to the Library", async ({ page }) => {
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/books/shape-of-time/folios/root-folio-01");

  await page.evaluate(() => {
    window.history.pushState({}, "", "/books/not-a-book/folios/not-a-folio");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });

  await expect(page).toHaveURL(/\/library$/u);
  await expect(page.getByRole("heading", { name: "Your library" })).toBeVisible();
  expect(pageErrors).toEqual([]);
});
