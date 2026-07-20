import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import { test } from "node:test";

import { EXPECTED_UNDERTOW_SHA256, EXPECTED_WORLD_SHA256 } from "./verify-genesis.mjs";

const CONTENT = new URL("../content/shape-of-time/", import.meta.url);
const FABLE_PROMPTS = new URL("../prompts/fable/", import.meta.url);
const ROOT = new URL("../", import.meta.url);

const retiredPatterns = [
  /\bdark thing\b/i,
  /disturbance.{0,80}(?:amplif|grow stronger|snowball)/i,
  /(?:scattered|duplicate|multiple)\s+(?:copies|selves|versions)\s+of\s+(?:a person|someone|Jay)/i,
  /Jay.{0,80}(?:mystical|supernatural|innate).{0,40}(?:temporal|time)/i,
  /(?:fixed|immutable|unchanging).{0,30}2150/i,
];
const codeShapedCanonPatterns = [
  /\[(?:ARC|TIME|TECH|EDGE|ECON|CHAR|FORBID)-[^\]]+\]/,
  /\bSOURCE FACT\b/,
  /\bPROPOSED A0 DECISION\b/,
  /\bINTENTIONALLY UNSPECIFIED\b/,
  /world\.md:L\d/,
  /\bschemaVersion\b/,
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

async function content(name, encoding) {
  return readFile(new URL(name, CONTENT), encoding);
}

async function prompt(name) {
  return readFile(new URL(name, FABLE_PROMPTS), "utf8");
}

async function rootDocument(name) {
  return readFile(new URL(name, ROOT), "utf8");
}

function requireAll(text, fragments, label) {
  for (const fragment of fragments) {
    assert.ok(text.includes(fragment), `${label} is missing ${fragment}`);
  }
}

function count(text, fragment) {
  return text.split(fragment).length - 1;
}

function retiredMaterialIssues(text) {
  return retiredPatterns.flatMap((pattern) => (pattern.test(text) ? [pattern.source] : []));
}

function codeShapedCanonIssues(text) {
  return codeShapedCanonPatterns.flatMap((pattern) => (pattern.test(text) ? [pattern.source] : []));
}

function writerTemplateIssues(template) {
  const issues = [];
  const requiredOnce = [
    "{{WORLD_DOCUMENT}}",
    "{{BOOK_ORIGIN}}",
    "{{CURRENT_MOVEMENT_BRIEF}}",
    "{{STORY_SO_FAR}}",
    "{{TEMPORAL_RULES}}",
    "{{CURRENT_FOLIO_BRIEF}}",
  ];

  for (const placeholder of requiredOnce) {
    if (count(template, placeholder) !== 1) {
      issues.push(`${placeholder} must occur exactly once`);
    }
  }

  const orderedMarkers = [
    "<documents>",
    "{{WORLD_DOCUMENT}}",
    "{{BOOK_ORIGIN}}",
    "{{CURRENT_MOVEMENT_BRIEF}}",
    "{{STORY_SO_FAR}}",
    "{{TEMPORAL_RULES}}",
    "<current_folio>",
    "{{CURRENT_FOLIO_BRIEF}}",
    "<writing_request>",
    "<output_format>",
  ];
  let previous = -1;
  for (const marker of orderedMarkers) {
    const position = template.indexOf(marker);
    if (position < 0) {
      issues.push(`missing ordered marker ${marker}`);
    } else if (position <= previous) {
      issues.push(`marker is out of order: ${marker}`);
    }
    previous = Math.max(previous, position);
  }

  for (const forbidden of [
    "story-bible.md",
    "arc.md",
    "authority.json",
    "visual-bible.md",
    "undertow.md",
    "CRAFT_EXAMPLES",
    "### Part Seven: The Undertow",
    "# Shape of Time — Visual Bible",
    "# Shape of Time — Visual Development Proposal",
    "# Shape of Time — Visual Direction",
    "<craft_examples>",
  ]) {
    if (template.includes(forbidden)) issues.push(`baseline includes forbidden input ${forbidden}`);
  }

  const guidanceOpen = template.indexOf("<prose_guidance>");
  const guidanceClose = template.indexOf("</prose_guidance>");
  const requestOpen = template.indexOf("<writing_request>");
  const requestClose = template.indexOf("</writing_request>");
  if (count(template, "<prose_guidance>") !== 1 || count(template, "</prose_guidance>") !== 1) {
    issues.push("baseline must contain exactly one prose-guidance block");
  } else if (!(requestOpen < guidanceOpen && guidanceOpen < guidanceClose && guidanceClose < requestClose)) {
    issues.push("prose-guidance block must remain inside the writing request");
  }

  return issues;
}

function renderWriterTemplate(template, inputs) {
  let rendered = template;
  for (const [name, value] of Object.entries(inputs)) {
    rendered = rendered.replace("{{" + name + "}}", value);
  }
  return rendered;
}

function renderedPromptIssues(rendered, expected) {
  const issues = [];
  for (const [name, value] of Object.entries({
    world: expected.world,
    brief: expected.brief,
    rules: expected.rules,
  })) {
    if (count(rendered, value) !== 1) issues.push(name + " must render byte-exactly once");
  }
  if (/{{[A-Z0-9_]+}}/.test(rendered)) issues.push("rendered prompt has an unresolved placeholder");

  const orderedValues = [
    expected.world,
    expected.parent,
    expected.brief,
    expected.history,
    expected.rules,
    expected.current,
    "<writing_request>",
  ];
  let previous = -1;
  for (const value of orderedValues) {
    const position = rendered.indexOf(value);
    if (position < 0 || position <= previous) issues.push("rendered prompt order is invalid");
    previous = Math.max(previous, position);
  }
  for (const source of expected.excluded) {
    if (rendered.includes(source)) issues.push("rendered prompt contains an excluded source");
  }

  return issues;
}

test("A0 begins from the byte-exact corrected world and segregated Undertow source", async () => {
  assert.equal(sha256(await content("world.md")), EXPECTED_WORLD_SHA256);
  assert.equal(sha256(await content("undertow.md")), EXPECTED_UNDERTOW_SHA256);
});

test("world.md is the sole comprehensive narrative authority", async () => {
  const files = await readdir(CONTENT);
  const visual = await content("visual-bible.md", "utf8");

  assert.ok(files.includes("world.md"));
  assert.ok(files.includes("root-movement-01.md"));
  assert.ok(files.includes("visual-bible.md"));
  assert.ok(!files.includes("story-bible.md"), "lossy story-bible duplicate must be removed");
  assert.ok(!files.includes("arc.md"), "duplicated six-part arc must be removed");
  assert.ok(!files.includes("authority.json"), "narrative authority must not be a typed manifest");
  requireAll(
    visual,
    [
      "# Shape of Time — Visual Direction",
      "REVIEW_STATUS: MEDIUM_APPROVED_CONTINUITY_PENDING",
      "not a scene plan",
      "never an input to the Fable prose prompt",
    ],
    "visual-bible.md",
  );
});

test("the first root movement is finite while the root book remains continuable", async () => {
  const brief = await content("root-movement-01.md", "utf8");

  requireAll(
    brief,
    [
      "Jay",
      "Tan",
      "phone",
      "Clef",
      "courtship",
      "temporal movement",
      "invitation",
      "Travel has not begun",
      "first finite movement",
      "root book continues",
      "world.md",
    ],
    "root-movement-01.md",
  );
  assert.ok(brief.split(/\s+/).length < 700, "movement brief has become a second story summary");
  assert.deepEqual(codeShapedCanonIssues(brief), []);
  assert.doesNotMatch(brief, /authoriz(?:e|es|ed|ing) sponsorship/i);
});

test("the temporal guardrail preserves the old anti-trope function without a fact taxonomy", async () => {
  const rules = await prompt("temporal-rules.md");

  requireAll(
    rules,
    [
      "<temporal_rules>",
      "</temporal_rules>",
      "Time Travel Tropes: What's False vs. What's True",
      "never resets",
      "one continuous existence",
      "branching timelines",
      "causation operates in every temporal direction",
      "weaken with distance",
      "butterfly effects",
      "grandfather paradoxes",
      "predestination",
      "prophecy",
      "subjective time",
      "PRMTTs",
      "maps",
      "currents",
      "does not make anyone younger",
      "physics, not magic",
      "continues living and changing",
      "unmapped and unstable",
      "study and practice",
      "frightening, strange, or beautiful",
    ],
    "temporal-rules.md",
  );
  assert.deepEqual(codeShapedCanonIssues(rules), []);
  assert.doesNotMatch(rules, /fixed 2150/i);

  for (const mutation of [
    "[TIME-01] SOURCE FACT",
    "PROPOSED A0 DECISION",
    "INTENTIONALLY UNSPECIFIED",
    "world.md:L20-L21",
    "\"schemaVersion\": 1",
  ]) {
    assert.ok(codeShapedCanonIssues(rules + "\n" + mutation).length > 0, "code-shaped mutation escaped");
  }
});

test("the baseline Fable template keeps long documents first and the request last", async () => {
  const template = await prompt("write-folio.md");
  const excludedSources = await Promise.all([
    content("undertow.md", "utf8"),
    content("visual-bible.md", "utf8"),
    prompt("craft-examples.md"),
  ]);

  assert.deepEqual(writerTemplateIssues(template), []);
  requireAll(
    template,
    [
      "<document_content>",
      "</document_content>",
      '"proseParagraphs"',
      '"imageDirection"',
      '"narrativeJob"',
      '"factLeftToImage"',
      "For a text-led folio, imageDirection must be null.",
      "clear, absorbing narrative prose",
      "concise orienting exposition",
      "<prose_guidance>",
      "Good prose sounds like a person who knows exactly what they mean and says it once.",
      "Do not flatten the register",
      "Return only",
    ],
    "write-folio.md",
  );

  const mutations = [
    template.replace("{{WORLD_DOCUMENT}}", ""),
    template.replace("{{WORLD_DOCUMENT}}", "{{WORLD_DOCUMENT}}{{WORLD_DOCUMENT}}"),
    template.replace("<writing_request>", "story-bible.md\n<writing_request>"),
    template.replace("{{TEMPORAL_RULES}}", "").concat("\n{{TEMPORAL_RULES}}"),
    template.replace("<prose_guidance>", "<removed_prose_guidance>"),
    template.replace(
      "</writing_request>",
      `${template.match(/<prose_guidance>[\s\S]*?<\/prose_guidance>/)[0]}\n</writing_request>`,
    ),
    template.replace(
      /(<prose_guidance>[\s\S]*?<\/prose_guidance>)\s*/,
      "</writing_request>\n$1\n<writing_request>\n",
    ),
    ...excludedSources.map((source) => template.concat("\n", source)),
  ];
  for (const [index, mutation] of mutations.entries()) {
    assert.ok(writerTemplateIssues(mutation).length > 0, `writer-template mutation ${index} escaped`);
  }
});

test("a rendered baseline contains the actual approved sources once and rejects excluded inputs", async () => {
  const [template, world, brief, rules, undertow, visual, examples] = await Promise.all([
    prompt("write-folio.md"),
    content("world.md", "utf8"),
    content("root-movement-01.md", "utf8"),
    prompt("temporal-rules.md"),
    content("undertow.md", "utf8"),
    content("visual-bible.md", "utf8"),
    prompt("craft-examples.md"),
  ]);
  const inputs = {
    WORLD_DOCUMENT: world,
    BOOK_ORIGIN: "This is the root Shape of Time book.",
    CURRENT_MOVEMENT_BRIEF: brief,
    STORY_SO_FAR: "<folio ordinal=\"1\">Prior prose.</folio>\n[NARRATIVE_IMAGE_BLOCK ordinal=\"1\"]",
    TEMPORAL_RULES: rules,
    CURRENT_FOLIO_BRIEF: "Jay notices Tan waiting at the counter and chooses to help her.",
  };
  const expected = {
    world,
    brief,
    rules,
    parent: inputs.BOOK_ORIGIN,
    history: inputs.STORY_SO_FAR,
    current: inputs.CURRENT_FOLIO_BRIEF,
    excluded: [undertow, visual, examples],
  };
  const render = (overrides = {}) => renderWriterTemplate(template, { ...inputs, ...overrides });

  assert.deepEqual(renderedPromptIssues(render(), expected), []);

  const mutations = [
    render({ STORY_SO_FAR: inputs.STORY_SO_FAR + "\n" + world }),
    render({ STORY_SO_FAR: inputs.STORY_SO_FAR + "\n" + undertow }),
    render({ STORY_SO_FAR: inputs.STORY_SO_FAR + "\n" + visual }),
    render({ STORY_SO_FAR: inputs.STORY_SO_FAR + "\n" + examples }),
  ];
  for (const mutation of mutations) {
    assert.ok(renderedPromptIssues(mutation, expected).length > 0, "rendered-source mutation escaped");
  }
});

test("the adapted craft examples are optional evidence, never baseline authority", async () => {
  const examples = await prompt("craft-examples.md");
  const baseline = await prompt("write-folio.md");

  requireAll(
    examples,
    [
      "not part of the baseline prompt",
      "Create places, not abstractions",
      "Stay in scene, not above it",
      "Ritual and specificity over summary",
      "GOOD",
      "BAD",
      "77e0c74",
      "controlled A/B experiment",
    ],
    "craft-examples.md",
  );
  assert.ok(!baseline.includes("Create places, not abstractions"));
  assert.ok(!baseline.includes("Stay in scene, not above it"));
  assert.ok(!baseline.includes("Ritual and specificity over summary"));
});

test("the baseline includes one compact human-authored fiction register", async () => {
  const [template, spec, evals, plan] = await Promise.all([
    prompt("write-folio.md"),
    rootDocument("SPEC.md"),
    rootDocument("EVALS.md"),
    rootDocument("PLAN.md"),
  ]);
  const matches = [...template.matchAll(/<prose_guidance>([\s\S]*?)<\/prose_guidance>/g)];

  assert.equal(matches.length, 1, "write-folio.md must contain exactly one prose-guidance block");
  const guidance = matches[0][1];
  const normalizedGuidance = guidance.replace(/\s+/gu, " ").trim();
  requireAll(
    normalizedGuidance,
    [
      "Good prose sounds like a person who knows exactly what they mean and says it once.",
      "Established world terms",
      "manufactured profundity",
      "physical action, choice, speech, thought, or consequence",
      "one unambiguous antecedent",
      "fewer well-chosen things",
      "Do not use em dashes or en dashes in narration",
      "Do not flatten the register",
      "not a rigid show-don't-tell rule",
    ],
    "write-folio.md prose guidance",
  );
  const requestStart = template.indexOf("<writing_request>");
  const requestEnd = template.indexOf("</writing_request>");
  const guidanceStart = template.indexOf("<prose_guidance>");
  const guidanceEnd = template.indexOf("</prose_guidance>");
  assert.ok(requestStart < guidanceStart && guidanceEnd < requestEnd, "prose guidance must stay inside the request");
  assert.doesNotMatch(guidance, /(?:^|\n)(?:BAD|GOOD):/m);
  assert.doesNotMatch(guidance, /^\s*[-*]\s/m, "the register must not grow into a checklist");
  assert.ok(guidance.split(/\s+/u).length < 400, "the register has become an accumulating style bible");

  requireAll(
    spec.replace(/\s+/gu, " "),
    [
      "One fixed, human-authored prose-guidance block",
      "an editing register, not a style sample or automated prose filter",
      "requires a repeated named failure from consecutive human reading",
    ],
    "SPEC.md writing authority",
  );
  requireAll(
    evals.replace(/\s+/gu, " "),
    [
      "compact human-authored prose-guidance block",
      "may not certify prose quality with vocabulary regexes or a style score",
    ],
    "EVALS.md literary gate",
  );
  requireAll(
    plan.replace(/\s+/gu, " "),
    [
      "one compact human-authored prose-guidance block",
      "fixed prose-guidance block",
      "Structural tests prove only that the compact prose guidance is present and bounded",
    ],
    "PLAN.md prompt contract",
  );
});

test("Undertow, visual authority, and retired concepts cannot enter the prose baseline", async () => {
  const template = await prompt("write-folio.md");
  const pilot = await content("root-movement-01.md", "utf8");

  assert.ok(!template.toLowerCase().includes("undertow"));
  assert.ok(!template.toLowerCase().includes("visual bible"));
  assert.deepEqual(retiredMaterialIssues(`${template}\n${pilot}`), []);

  const retiredMutations = [
    "A malevolent dark thing waits at the edge.",
    "The disturbance will amplify until it swallows every era.",
    "There are scattered copies of Jay across time.",
    "Jay has an innate mystical sense of temporal currents.",
    "The fixed 2150 chronology cannot change.",
  ];
  for (const mutation of retiredMutations) {
    assert.ok(retiredMaterialIssues(mutation).length > 0, `retired mutation escaped: ${mutation}`);
  }
});

test("visual authority stays story-wide while Clef, places, and scenes stay book-local", async () => {
  const visual = await content("visual-bible.md", "utf8");

  requireAll(
    visual,
    [
      "owner-approved story-wide medium",
      "book-local visual profile",
      "folio image brief",
      "Clef remains visually indeterminate at world scope",
      "Different books may realize it differently",
      "There is no single visual shorthand for “the future.”",
      "Oakland is an anchor, not a boundary",
      "past and future are relational descriptions of travel along Primas, not two kinds of era",
      "many places and times",
    ],
    "visual-bible.md",
  );

  for (const overreach of [
    "amber-red translucent pressed flake",
    "glassine sleeve",
    "approximately 5.5 metres wide",
    "Lake Merritt",
    "12th Street BART",
    "cobalt rubber case",
    "three off-axis crescent rails",
    "Oakland Offset",
  ]) {
    assert.ok(!visual.includes(overreach), `visual bible still contains scene-level overreach: ${overreach}`);
  }
});

test("finite movements support unbounded continuation and child books resist root-plot gravity", async () => {
  const [spec, evals, plan, handoff, source, template] = await Promise.all([
    rootDocument("SPEC.md"),
    rootDocument("EVALS.md"),
    rootDocument("PLAN.md"),
    rootDocument("HANDOFF.md"),
    content("SOURCE.md", "utf8"),
    prompt("write-folio.md"),
  ]);

  requireAll(
    spec,
    [
      "finite narrative movements",
      "without a predetermined final folio",
      "After the six-part arc resolves",
      "must not undo or replay that ending",
      "root plot is not a template",
      "founding premise",
      "Shared world physics and social facts remain available to every book",
      "Oakland anchors the root but does not bound the library",
      "past and future are relational shorthand",
    ],
    "SPEC.md",
  );
  assert.ok(!spec.includes("Every book ends; the library does not."));
  assert.ok(!spec.includes("Each individual book is bounded."));
  assert.ok(!plan.includes("bounded book plan"));

  const b0 = plan.slice(plan.indexOf("### B0"), plan.indexOf("### B1"));
  for (const codeShapedBeat of ["state before/after", "required world facts", "open/resolved threads"]) {
    assert.ok(!b0.includes(codeShapedBeat), `B0 still requires code-shaped beat data: ${codeShapedBeat}`);
  }

  const currentAuthority = [spec, evals, plan, handoff, source].join("\n");
  for (const stale of [
    "small pilot boundary",
    "The pilot never enters",
    "pilot arc",
    "review of the pilot",
    "part of the pilot",
  ]) {
    assert.ok(!currentAuthority.includes(stale), `current authority still uses stale pilot wording: ${stale}`);
  }

  requireAll(
    template,
    [
      "root trajectory is context, not a plot template",
      "founding premise, not an instruction to continue the parent scene",
      "current finite movement",
    ],
    "write-folio.md",
  );
  requireAll(
    evals,
    [
      "cross a movement boundary",
      "does not replay the Jay and Tan trajectory",
      "outside Oakland or the Bay Area",
      "Phantas Minor",
    ],
    "EVALS.md",
  );
  requireAll(
    plan,
    [
      "CURRENT_MOVEMENT_BRIEF",
      "post-arc movement",
      "lineage-local",
      "sibling isolation",
    ],
    "PLAN.md",
  );
});

test("project authority documents describe the world-first prompt architecture", async () => {
  const [spec, evals, plan, handoff, readme] = await Promise.all(
    ["SPEC.md", "EVALS.md", "PLAN.md", "HANDOFF.md", "README.md"].map(rootDocument),
  );
  const stableAuthority = [spec, evals, plan, readme].join("\n");

  for (const rejectedPath of ["story-bible.md", "arc.md", "authority.json"]) {
    assert.ok(!stableAuthority.includes(rejectedPath), "current authority still requires " + rejectedPath);
  }

  requireAll(
    spec,
    [
      "sole comprehensive factual and plot authority",
      "strong temporal-rules block",
      "optional craft examples",
      "controlled A/B experiment",
    ],
    "SPEC.md",
  );
  requireAll(
    plan,
    [
      "content/shape-of-time/root-movement-01.md",
      "prompts/fable/temporal-rules.md",
      "prompts/fable/write-folio.md",
      "prompts/fable/craft-examples.md",
    ],
    "PLAN.md",
  );
  requireAll(
    handoff,
    [
      "world.md is the sole comprehensive factual and plot authority",
      "The rejected story-bible, duplicated arc, and typed authority manifest were deleted",
      "A2's runnable one-package application spine is complete locally and on Railway",
      "C0/C1 reader-first slice complete",
      "private editorial progress",
      "No narrative slice asset has been published",
    ],
    "HANDOFF.md",
  );
});
