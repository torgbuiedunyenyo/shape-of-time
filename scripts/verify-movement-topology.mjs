#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const CODE_SHAPED_PATTERNS = [
  [/^---\s*\n/, "frontmatter"],
  [/^\s*```/m, "code fences"],
  [/^\s*\|.+\|\s*$/m, "tables"],
  [/^\s*\{\s*"[^"]+"\s*:/m, "JSON-like objects"],
  [/^\s*["'][A-Za-z][^"']*["']\s*:/m, "JSON-like keys"],
  [/\[(?:ARC|TIME|TECH|EDGE|ECON|CHAR|FORBID)-[^\]]+\]/i, "fact IDs"],
  [
    /^\s*(?:Fact IDs?|Thread ledger|State before|State after|Required world facts?|Open\/resolved threads?|Lineage ID|schemaVersion)\s*:/im,
    "code-shaped planning fields",
  ],
];

function normalize(text) {
  return text.replace(/[*_`]/g, "").replace(/\s+/g, " ").trim();
}

function wordCount(text) {
  return normalize(text).split(/\s+/).filter(Boolean).length;
}

function headings(text) {
  return [...text.matchAll(/^(#{1,6}) ([^\n]+)$/gm)].map((match) => ({
    level: match[1].length,
    title: match[2].trim(),
    index: match.index,
  }));
}

function levelSections(text, level) {
  const hashes = "#".repeat(level);
  const pattern = new RegExp(`^${hashes} ([^\\n]+)$`, "gm");
  const matches = [...text.matchAll(pattern)];
  return matches.map((match, index) => ({
    heading: match[1].trim(),
    body: text.slice(match.index + match[0].length, matches[index + 1]?.index ?? text.length),
  }));
}

function folios(text, level) {
  return levelSections(text, level).flatMap((section) => {
    const match = /^Folio (\d{2})\s+[—-]\s+(.+)$/i.exec(section.heading);
    return match
      ? [{ ordinal: Number(match[1]), displayOrdinal: match[1], title: match[2].trim(), body: section.body }]
      : [];
  });
}

function bodyBeforeHeadingLevel(text, level) {
  const marker = new RegExp(`^${"#".repeat(level)} `, "m").exec(text);
  return text.slice(0, marker?.index ?? text.length);
}

function bodyBeforeFolios(text, level) {
  const marker = new RegExp(`^${"#".repeat(level)} Folio \\d{2}\\b`, "m").exec(text);
  return text.slice(0, marker?.index ?? text.length);
}

function bodyLengthIssues(text, minimum, maximum, label) {
  const count = wordCount(text);
  if (count < minimum) return [`${label} is too thin for review; found ${count} words`];
  if (count > maximum) return [`${label} has become over-specified; found ${count} words`];
  return [];
}

function contiguousIssues(items, expectedStart, label) {
  const actual = items.map((item) => item.ordinal);
  const expected = items.map((_, index) => expectedStart + index);
  return actual.some((ordinal, index) => ordinal !== expected[index])
    ? [`${label} folios must be contiguous from ${String(expectedStart).padStart(2, "0")}; found ${actual.join(", ")}`]
    : [];
}

function foundingCitations(introduction) {
  return [
    ...introduction.matchAll(/>\s*\*\*Founded from root folio (\d{2}):\*\*\s*[“"]([^”"]+)[”"]/gi),
  ];
}

function codeShapedIssues(text, label) {
  return CODE_SHAPED_PATTERNS.flatMap(([pattern, description]) =>
    pattern.test(text) ? [`${label} contains ${description}`] : [],
  );
}

function unexpectedHeadingIssues(text, allowedLevel, allowedPattern, label) {
  return headings(text).flatMap((heading) =>
    heading.level !== allowedLevel || !allowedPattern.test(heading.title)
      ? [`${label} contains unexpected H${heading.level} heading “${heading.title}”`]
      : [],
  );
}

function duplicateTextIssues(entries) {
  const seen = new Map();
  const issues = [];
  for (const entry of entries) {
    const value = normalize(entry.text).toLowerCase();
    if (!value) continue;
    const prior = seen.get(value);
    if (prior) issues.push(`${entry.label} duplicates ${prior}`);
    else seen.set(value, entry.label);
  }
  return issues;
}

export function movementTopologyIssues({ root, children }) {
  const issues = [];
  if (typeof root !== "string") issues.push("missing content/prototype-movements.md");
  if (typeof children !== "string") issues.push("missing content/prepared-children.md");
  if (issues.length > 0) return issues;

  issues.push(...codeShapedIssues(root, "prototype movements"));
  issues.push(...codeShapedIssues(children, "prepared children"));

  const rootHeadings = headings(root);
  const rootH1 = rootHeadings.filter(({ level }) => level === 1);
  if (rootH1.length !== 1 || rootHeadings[0]?.level !== 1) {
    issues.push(`prototype movements must begin with exactly one H1; found ${rootH1.length}`);
  }
  if (rootHeadings.some(({ level }) => level > 3)) {
    issues.push("prototype movements may use only H1, H2, and folio H3 headings");
  }
  const firstRootH2 = rootHeadings.find(({ level }) => level === 2);
  const rootPreambleHeadings = headings(root.slice(0, firstRootH2?.index ?? root.length)).filter(
    ({ level }) => level > 1,
  );
  for (const heading of rootPreambleHeadings) {
    issues.push(`prototype movement preamble contains unexpected heading “${heading.title}”`);
  }

  const rootSections = levelSections(root, 2);
  const expectedRootSections = [/^Root movement one\s+[—-]\s+\S/, /^Root movement two\s+[—-]\s+\S/];
  if (
    rootSections.length !== 2 ||
    rootSections.some((section, index) => !expectedRootSections[index]?.test(section.heading))
  ) {
    issues.push(
      `prototype root H2 order must be movement one then movement two; found ${rootSections
        .map(({ heading }) => `“${heading}”`)
        .join(", ")}`,
    );
  }

  const first = expectedRootSections[0].test(rootSections[0]?.heading ?? "") ? rootSections[0] : undefined;
  const second = expectedRootSections[1].test(rootSections[1]?.heading ?? "") ? rootSections[1] : undefined;
  const firstFolios = first ? folios(first.body, 3) : [];
  const secondFolios = second ? folios(second.body, 3) : [];
  if (first) {
    issues.push(...unexpectedHeadingIssues(first.body, 3, /^Folio \d{2}\s+[—-]\s+.+$/, "root movement one"));
    if (firstFolios.length !== 14) {
      issues.push(`root movement one must contain exactly 14 folios; found ${firstFolios.length}`);
    }
    issues.push(...contiguousIssues(firstFolios, 1, "root movement one"));
    issues.push(...bodyLengthIssues(bodyBeforeFolios(first.body, 3), 60, 400, "root movement one brief"));
  }
  if (second) {
    issues.push(...unexpectedHeadingIssues(second.body, 3, /^Folio \d{2}\s+[—-]\s+.+$/, "root movement two"));
    if (secondFolios.length < 1 || secondFolios.length > 2) {
      issues.push(`root movement two must prepare 1–2 opening folios; found ${secondFolios.length}`);
    }
    issues.push(...contiguousIssues(secondFolios, 15, "root movement two"));
    issues.push(...bodyLengthIssues(bodyBeforeFolios(second.body, 3), 60, 400, "root movement two brief"));
  }

  const rootFolios = [...firstFolios, ...secondFolios];
  const duplicateEntries = [];
  for (const folio of rootFolios) {
    issues.push(...bodyLengthIssues(folio.body, 35, 140, `root folio ${folio.displayOrdinal}`));
    duplicateEntries.push({ label: `root folio ${folio.displayOrdinal}`, text: folio.body });
  }

  const childHeadings = headings(children);
  const childH1 = childHeadings.filter(({ level }) => level === 1);
  if (childH1.length !== 1 || childHeadings[0]?.level !== 1) {
    issues.push(`prepared children must begin with exactly one H1; found ${childH1.length}`);
  }
  if (childHeadings.some(({ level }) => level > 4)) {
    issues.push("prepared children may use only H1 through folio H4 headings");
  }
  const firstChildH2 = childHeadings.find(({ level }) => level === 2);
  const childPreambleHeadings = headings(children.slice(0, firstChildH2?.index ?? children.length)).filter(
    ({ level }) => level > 1,
  );
  for (const heading of childPreambleHeadings) {
    issues.push(`prepared-child preamble contains unexpected heading “${heading.title}”`);
  }

  const levelTwo = levelSections(children, 2);
  const validChildOrder =
    levelTwo.length === 4 &&
    levelTwo.slice(0, 3).every(({ heading }) => /^Child book:\s+\S/.test(heading)) &&
    levelTwo[3]?.heading === "Why these books make a garden";
  if (!validChildOrder) {
    issues.push(
      `prepared child H2 order must be exactly three child books then the portfolio review; found ${levelTwo
        .map(({ heading }) => `“${heading}”`)
        .join(", ")}`,
    );
  }
  for (const section of levelTwo.slice(0, 3)) {
    if (section.heading === "Child book:" || /^Child book:\s*$/.test(section.heading)) {
      issues.push("child-book title must be nonempty");
    }
  }

  const childBooks = levelTwo.slice(0, 3).filter(({ heading }) => /^Child book:\s+\S/.test(heading));
  const portfolio = levelTwo.find(({ heading }) => heading === "Why these books make a garden");
  const titles = [];
  const sources = [];
  const axisCues = [];
  let successorCount = 0;

  for (const child of childBooks) {
    const title = child.heading.replace(/^Child book:\s*/i, "").trim();
    titles.push(title);
    const movementSections = levelSections(child.body, 3);
    const validMovementOrder =
      (movementSections.length === 1 || movementSections.length === 2) &&
      /^Opening movement\s+[—-]\s+\S/.test(movementSections[0]?.heading ?? "") &&
      (movementSections.length === 1 ||
        /^Following movement\s+[—-]\s+\S/.test(movementSections[1]?.heading ?? ""));
    if (!validMovementOrder) {
      issues.push(
        `child “${title}” H3 order must be one opening movement and an optional following movement; found ${movementSections
          .map(({ heading }) => `“${heading}”`)
          .join(", ")}`,
      );
    }

    const introduction = bodyBeforeHeadingLevel(child.body, 3);
    const citations = foundingCitations(introduction);
    if (citations.length !== 1) {
      issues.push(`child “${title}” must contain exactly one founding citation; found ${citations.length}`);
    } else {
      const sourceOrdinal = Number(citations[0][1]);
      const source = normalize(citations[0][2]);
      sources.push({ title, source, sourceOrdinal });
      const sourceFolio = rootFolios.find(({ ordinal }) => ordinal === sourceOrdinal);
      if (!sourceFolio || !normalize(sourceFolio.body).includes(source)) {
        issues.push(`child “${title}” founding phrase is not present in root folio ${citations[0][1]}`);
      }
    }
    const premiseWithoutCitation = introduction.replace(/^>\s*\*\*Founded[^\n]+$/m, "");
    issues.push(...bodyLengthIssues(premiseWithoutCitation, 50, 250, `child “${title}” premise`));
    duplicateEntries.push({ label: `child “${title}” premise`, text: premiseWithoutCitation });
    if (/^#### /m.test(introduction)) issues.push(`child “${title}” contains a folio before its opening movement`);

    const opening = /^Opening movement\s+[—-]\s+\S/.test(movementSections[0]?.heading ?? "")
      ? movementSections[0]
      : undefined;
    const following = /^Following movement\s+[—-]\s+\S/.test(movementSections[1]?.heading ?? "")
      ? movementSections[1]
      : undefined;
    if (!opening) continue;

    issues.push(...unexpectedHeadingIssues(opening.body, 4, /^Folio \d{2}\s+[—-]\s+.+$/, `child “${title}” opening`));
    const openingFolios = folios(opening.body, 4);
    if (openingFolios.length < 2 || openingFolios.length > 4) {
      issues.push(`child “${title}” opening movement must contain 2–4 folios; found ${openingFolios.length}`);
    }
    issues.push(...contiguousIssues(openingFolios, 1, `child “${title}” opening movement`));
    const openingBrief = bodyBeforeFolios(opening.body, 4);
    issues.push(...bodyLengthIssues(openingBrief, 60, 400, `child “${title}” opening brief`));
    duplicateEntries.push({ label: `child “${title}” opening brief`, text: openingBrief });

    let followingFolios = [];
    if (following) {
      successorCount += 1;
      issues.push(
        ...unexpectedHeadingIssues(following.body, 4, /^Folio \d{2}\s+[—-]\s+.+$/, `child “${title}” following`),
      );
      followingFolios = folios(following.body, 4);
      if (followingFolios.length < 1 || followingFolios.length > 2) {
        issues.push(`child “${title}” following movement must contain 1–2 folios; found ${followingFolios.length}`);
      }
      issues.push(
        ...contiguousIssues(followingFolios, openingFolios.length + 1, `child “${title}” following movement`),
      );
      const followingBrief = bodyBeforeFolios(following.body, 4);
      issues.push(...bodyLengthIssues(followingBrief, 60, 400, `child “${title}” following brief`));
      duplicateEntries.push({ label: `child “${title}” following brief`, text: followingBrief });
    }

    const allChildFolios = [...openingFolios, ...followingFolios];
    for (const folio of allChildFolios) {
      issues.push(...bodyLengthIssues(folio.body, 35, 140, `child “${title}” folio ${folio.displayOrdinal}`));
      duplicateEntries.push({ label: `child “${title}” folio ${folio.displayOrdinal}`, text: folio.body });
    }
    axisCues.push({
      title,
      premise: premiseWithoutCitation,
      openingBrief,
      folios: allChildFolios,
    });
  }

  const normalizedTitles = titles.map((title) => normalize(title).toLowerCase());
  if (new Set(normalizedTitles).size !== normalizedTitles.length) issues.push("prepared child titles must be unique");
  const normalizedSources = sources.map(({ source }) => source.toLowerCase());
  if (new Set(normalizedSources).size !== normalizedSources.length) {
    issues.push("prepared child founding phrases must be unique");
  }
  if (successorCount < 1) {
    issues.push("at least one child must include a successor movement with a contiguous prepared folio");
  }

  if (portfolio) {
    if (headings(portfolio.body).length > 0) issues.push("prepared-garden portfolio review may not contain nested headings");
    issues.push(...bodyLengthIssues(portfolio.body, 70, 250, "prepared-garden portfolio review"));
    for (const title of titles) {
      if (!normalize(portfolio.body).includes(normalize(title))) {
        issues.push(`prepared-garden portfolio review does not name child “${title}”`);
      }
    }
  }

  const axisCue = axisCues.find(
    ({ premise, openingBrief, folios: items }) =>
      /\b(?:Phantas|Mystas)\b/.test(premise) &&
      /\b(?:Phantas|Mystas)\b/.test(openingBrief) &&
      items.some(({ body }) => /\b(?:Phantas|Mystas)\b/.test(body)),
  );
  if (
    !axisCue ||
    !portfolio ||
    !normalize(portfolio.body).includes(axisCue.title) ||
    !/\b(?:Phantas|Mystas)\b/.test(portfolio.body)
  ) {
    issues.push(
      "Phantas/Mystas anti-omission cue must occur in one child premise, movement brief, folio, and portfolio review; material consequence remains a human judgment",
    );
  }

  issues.push(...duplicateTextIssues(duplicateEntries));
  return issues;
}

async function readIfPresent(url) {
  try {
    return await readFile(url, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

export async function auditPrototypeMovements(rootUrl) {
  return movementTopologyIssues({
    root: await readIfPresent(new URL("content/prototype-movements.md", rootUrl)),
    children: await readIfPresent(new URL("content/prepared-children.md", rootUrl)),
  });
}

const invoked = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : undefined;
if (invoked === import.meta.url) {
  const issues = await auditPrototypeMovements(new URL("../", import.meta.url));
  if (issues.length > 0) {
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log("Shape of Time movement topology is structurally eligible for human review.");
  }
}
