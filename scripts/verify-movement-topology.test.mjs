import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

import { movementTopologyIssues } from "./verify-movement-topology.mjs";

const ROOT_URL = new URL("../content/prototype-movements.md", import.meta.url);
const CHILDREN_URL = new URL("../content/prepared-children.md", import.meta.url);

function includesIssue(issues, fragment) {
  assert.ok(issues.some((issue) => issue.includes(fragment)), `missing issue containing: ${fragment}\n${issues.join("\n")}`);
}

function replaceExactlyOnce(text, search, replacement) {
  const parts = text.split(search);
  assert.equal(parts.length, 2, `mutation target must occur exactly once: ${search}`);
  return `${parts[0]}${replacement}${parts[1]}`;
}

async function documents() {
  return {
    root: await readFile(ROOT_URL, "utf8"),
    children: await readFile(CHILDREN_URL, "utf8"),
  };
}

test("B0 rejects an absent movement map before any literary planning can be claimed", () => {
  assert.deepEqual(movementTopologyIssues({}), [
    "missing content/prototype-movements.md",
    "missing content/prepared-children.md",
  ]);
});

test("B0 provides a structurally complete root and prepared-child topology", async () => {
  assert.deepEqual(movementTopologyIssues(await documents()), []);
});

test("B0 uses relational Primas language and owner-requested direct titles", async () => {
  const { root, children } = await documents();
  const rootTitles = [...root.matchAll(/^### Folio \d{2} - (.+)$/gm)].map((match) => match[1]);
  const childTitles = [...children.matchAll(/^#### Folio \d{2} - (.+)$/gm)].map((match) => match[1]);
  const rootMovementTitles = [...root.matchAll(/^## Root movement (?:one|two) - (.+)$/gm)].map((match) => match[1]);
  const childMovementTitles = [...children.matchAll(/^### (?:Opening|Following) movement - (.+)$/gm)].map(
    (match) => match[1],
  );

  assert.deepEqual(rootMovementTitles, ["The invitation", "The crossing"]);
  assert.deepEqual(rootTitles, [
    "Late shift",
    "Payment",
    "The gift",
    "The bus stop",
    "The band",
    "Your tomorrow or mine",
    "Thursday",
    "The venue",
    "After closing",
    "Laundry",
    "Come see it",
    "The map",
    "The return ticket",
    "Jay says yes",
    "The application",
    "Departure",
  ]);
  assert.deepEqual(childMovementTitles, ["The last ferry", "Yesterday's safe route", "The safer room", "The recording"]);
  assert.deepEqual(childTitles, [
    "The licensed route",
    "The order to return",
    "The crossing",
    "The terminal wall",
    "The official copy",
    "The correction",
    "Two rooms",
    "Tomorrow's programme",
    "The badges",
    "After the all-clear",
    "The last bar",
    "Performer unknown",
    "The offer",
    "Three bicycles",
  ]);
  assert.doesNotMatch(children, /\blater[- ]Primas\b/i);
  assert.match(children, /a visitor from another coordinate along Primas/);
});

test("B0 rejects missing, reversed, and extra root structure", async () => {
  const { root, children } = await documents();
  includesIssue(movementTopologyIssues({ root: root.replace(/^# [^\n]+\n/, ""), children }), "exactly one H1");

  const hiddenPreambleHeading = root.replace(/^# ([^\n]+)\n/, "# $1\n\n### Hidden preamble heading\n");
  includesIssue(
    movementTopologyIssues({ root: hiddenPreambleHeading, children }),
    "prototype movement preamble contains unexpected heading",
  );

  const match = /(## Root movement one[\s\S]*?)(## Root movement two[\s\S]*)$/m.exec(root);
  assert.ok(match);
  const reversed = root.slice(0, match.index) + match[2] + match[1];
  includesIssue(movementTopologyIssues({ root: reversed, children }), "movement one then movement two");

  const extra = `${root}\n\n## Root movement three - Hidden\n\nAn extra movement.\n`;
  includesIssue(movementTopologyIssues({ root: extra, children }), "movement one then movement two");

  const unexpected = replaceExactlyOnce(root, "### Folio 03", "### Notes\n\nHidden notes.\n\n### Folio 03");
  includesIssue(movementTopologyIssues({ root: unexpected, children }), "unexpected H3 heading “Notes”");
});

test("B0 rejects incomplete and discontinuous root folio runs", async () => {
  const { root, children } = await documents();
  const missingFinal = root.replace(/^### Folio 14\b[\s\S]*?(?=^## Root movement two)/m, "");
  includesIssue(movementTopologyIssues({ root: missingFinal, children }), "exactly 14 folios; found 13");

  const missingSuccessor = root.replace(/^## Root movement two\b[\s\S]*$/m, "");
  includesIssue(movementTopologyIssues({ root: missingSuccessor, children }), "movement one then movement two");

  const skippedOrdinal = replaceExactlyOnce(root, "### Folio 16", "### Folio 17");
  includesIssue(movementTopologyIssues({ root: skippedOrdinal, children }), "contiguous from 15; found 15, 17");
});

test("B0 enforces the complete child heading tree and one founding citation", async () => {
  const { root, children } = await documents();
  includesIssue(
    movementTopologyIssues({ root, children: children.replace(/^# [^\n]+\n/, "") }),
    "prepared children must begin with exactly one H1",
  );

  const hiddenFourth = replaceExactlyOnce(
    children,
    "## Why these books make a garden",
    "## Prepared child: Hidden\n\nHidden body.\n\n## Why these books make a garden",
  );
  includesIssue(movementTopologyIssues({ root, children: hiddenFourth }), "exactly three child books then the portfolio");

  const hiddenPreambleHeading = children.replace(/^# ([^\n]+)\n/, "# $1\n\n#### Hidden preamble heading\n");
  includesIssue(
    movementTopologyIssues({ root, children: hiddenPreambleHeading }),
    "prepared-child preamble contains unexpected heading",
  );

  const emptyTitle = replaceExactlyOnce(children, "## Child book: The Map on the Wall", "## Child book:");
  includesIssue(movementTopologyIssues({ root, children: emptyTitle }), "child-book title must be nonempty");

  const unexpectedMovement = replaceExactlyOnce(
    children,
    "### Opening movement - The safer room",
    "### Notes\n\nHidden notes.\n\n### Opening movement - The safer room",
  );
  includesIssue(movementTopologyIssues({ root, children: unexpectedMovement }), "H3 order must be one opening movement");

  const citation = '> **Founded from root folio 12:** "The maps were always becoming wrong"';
  const duplicateCitation = replaceExactlyOnce(children, citation, `${citation}\n${citation}`);
  includesIssue(movementTopologyIssues({ root, children: duplicateCitation }), "exactly one founding citation; found 2");
});

test("B0 rejects child range and continuation-boundary mutations", async () => {
  const { root, children } = await documents();
  const oneFolio = children.replace(/^#### Folio 02 - Tomorrow's programme[\s\S]*?(?=^## Child book: Performer)/m, "");
  includesIssue(movementTopologyIssues({ root, children: oneFolio }), "opening movement must contain 2–4 folios; found 1");

  const fifthFolio = replaceExactlyOnce(
    children,
    "### Following movement - Yesterday's safe route",
    "#### Folio 05 - Extra opening\n\nThis deliberately extra folio contains enough ordinary planning prose to clear the broad length floor while proving that a five-folio child opening is rejected by structure. It adds no valid movement.\n\n### Following movement - Yesterday's safe route",
  );
  includesIssue(movementTopologyIssues({ root, children: fifthFolio }), "opening movement must contain 2–4 folios; found 5");

  const resetSuccessor = replaceExactlyOnce(children, "#### Folio 05 - The official copy", "#### Folio 01 - The official copy");
  includesIssue(movementTopologyIssues({ root, children: resetSuccessor }), "following movement folios must be contiguous");

  const thirdSuccessor = replaceExactlyOnce(
    children,
    "## Child book: Blue Badges",
    "#### Folio 07 - Extra successor\n\nThis third prepared successor folio is deliberately long enough to be structurally visible. It exists only to prove that the accepted following movement cannot silently expand beyond two prepared folios.\n\n## Child book: Blue Badges",
  );
  includesIssue(movementTopologyIssues({ root, children: thirdSuccessor }), "following movement must contain 1–2 folios; found 3");

  const noSuccessor = children.replace(/^### Following movement[\s\S]*?(?=^## Child book:)/m, "");
  includesIssue(movementTopologyIssues({ root, children: noSuccessor }), "at least one child must include a successor movement");
});

test("B0 verifies exact root origins and catches copied planning prose", async () => {
  const { root, children } = await documents();
  const invented = replaceExactlyOnce(children, "The maps were always becoming wrong", "The maps were always becoming right");
  includesIssue(movementTopologyIssues({ root, children: invented }), "founding phrase is not present in root folio 12");

  const wrongFolio = replaceExactlyOnce(children, "Founded from root folio 12", "Founded from root folio 11");
  includesIssue(movementTopologyIssues({ root, children: wrongFolio }), "founding phrase is not present in root folio 11");

  const reused = replaceExactlyOnce(children, "fully managed Blitz night", "The maps were always becoming wrong");
  includesIssue(movementTopologyIssues({ root, children: reused }), "founding phrases must be unique");

  const mapBrief = /### Opening movement - The last ferry\n\n([\s\S]*?)(?=^#### Folio 01)/m.exec(children)?.[1];
  const blueBrief = /### Opening movement - The safer room\n\n([\s\S]*?)(?=^#### Folio 01)/m.exec(children)?.[1];
  assert.ok(mapBrief && blueBrief);
  const copiedBrief = replaceExactlyOnce(children, blueBrief, mapBrief);
  includesIssue(movementTopologyIssues({ root, children: copiedBrief }), "opening brief duplicates");

  const rootBody = /### Folio 01[^\n]*\n\n([\s\S]*?)(?=^### Folio 02)/m.exec(root)?.[1];
  const childBody = /#### Folio 01 - The licensed route\n\n([\s\S]*?)(?=^#### Folio 02)/m.exec(children)?.[1];
  assert.ok(rootBody && childBody);
  const copiedRoot = replaceExactlyOnce(children, childBody, rootBody);
  includesIssue(movementTopologyIssues({ root, children: copiedRoot }), "duplicates root folio 01");
});

test("B0 requires a substantive portfolio review and distributed axis cue without claiming semantics", async () => {
  const { root, children } = await documents();
  const missingPortfolio = children.replace(/^## Why these books make a garden[\s\S]*$/m, "");
  includesIssue(movementTopologyIssues({ root, children: missingPortfolio }), "exactly three child books then the portfolio");

  const thinPortfolio = children.replace(
    /^## Why these books make a garden[\s\S]*$/m,
    "## Why these books make a garden\n\nThe Map on the Wall, Blue Badges, and Performer Unknown.\n",
  );
  includesIssue(movementTopologyIssues({ root, children: thinPortfolio }), "portfolio review is too thin");

  const axisOnlyInPortfolio = children.replace(
    /## Child book: The Map on the Wall[\s\S]*?(?=^## Child book: Blue Badges)/m,
    (section) => section.replaceAll("Phantas", "Primas").replaceAll("Mystas", "Primas"),
  );
  includesIssue(movementTopologyIssues({ root, children: axisOnlyInPortfolio }), "anti-omission cue must occur");

  const axisMissingFromPortfolio = children.replace(
    /## Why these books make a garden[\s\S]*$/m,
    (section) => section.replaceAll("Phantas", "Primas").replaceAll("Mystas", "Primas"),
  );
  includesIssue(movementTopologyIssues({ root, children: axisMissingFromPortfolio }), "anti-omission cue must occur");
});

test("B0 rejects anchored code-shaped planning fields", async () => {
  const { root, children } = await documents();
  includesIssue(
    movementTopologyIssues({ root, children: `${children}\n\nState before: a code-shaped record\n` }),
    "code-shaped planning fields",
  );
  includesIssue(
    movementTopologyIssues({ root, children: `${children}\n\n{"state_before":"coded"}\n` }),
    "JSON-like",
  );
});
