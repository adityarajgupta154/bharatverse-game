/**
 * Headless world-data validation for ALL regions (CI twin of the dev-only
 * defineWorld guard — same shared validator, world-validate.ts).
 *
 * Auto-discovers every region under src/game/worlds/<dir>/ so a new region
 * cannot silently skip validation:
 *  - each region dir MUST have a config.ts exporting WORLD_DATA (the pure
 *    checked config both the app registry and this script consume),
 *  - importing it runs the JSON shape checks (a malformed buildings.json/
 *    npcs.json throws right here, with a per-field problem list),
 *  - validateWorldData() then cross-references semantics: duplicate ids,
 *    unknown routeTarget namespaces, game↔building completion-target
 *    mismatches, explore:/recap: targets whose story content neither exists
 *    nor is allowlisted as documented debt (content/links.ts), out-of-bounds
 *    positions, dangling unlocksAfter/linked ids, climax count, walk
 *    mask/spawn/anchor/waypoint integrity,
 *  - finally the PENDING_CONTENT_TARGETS allowlist itself is checked for
 *    stale entries no building references — the debt list can't rot into a
 *    skip-list.
 *
 * Run: pnpm --filter @workspace/bharatverse run verify:world-data
 * (first link of the verify:games chain — data validity precedes solvability)
 */
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { validateWorldData, type WorldData } from '../src/game/world-validate';
import {
  EXPLORE_CONTENT_IDS,
  RECAP_CONTENT_IDS,
  PENDING_CONTENT_TARGETS,
  contentPartsFromRouteTarget,
} from '../src/game/content/links';
import { getDiscoveryForRouteTarget } from '../src/game/content';
import { discoveryNarration } from '../src/game/content/narration';

// Every shipped region must be here — discovery finding FEWER than these is
// a failure (a deleted/renamed dir would otherwise pass an empty run).
const EXPECTED_NODE_IDS = [
  'apni-parampara',
  'kala-bhoomi',
  'khel-maidan',
  'magadha-kaal',
  'sindhu-ghati',
];

const worldsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/game/worlds'
);
const regionDirs = readdirSync(worldsDir, { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name)
  .sort();

let failed = 0;
const seenNodeIds: string[] = [];
const seenContentTargets = new Set<string>();

for (const dir of regionDirs) {
  const cfgPath = path.join(worldsDir, dir, 'config.ts');
  if (!existsSync(cfgPath)) {
    failed++;
    console.log(`FAIL ${dir} — region dir has no config.ts (worlds must export WORLD_DATA; see sindhu-ghati/config.ts)`);
    continue;
  }
  let data: WorldData | undefined;
  try {
    const mod = (await import(pathToFileURL(cfgPath).href)) as { WORLD_DATA?: WorldData };
    data = mod.WORLD_DATA;
  } catch (e) {
    failed++;
    console.log(`FAIL ${dir} — config threw at import (JSON shape):`);
    console.log(`  ${(e as Error).message.split('\n').join('\n  ')}`);
    continue;
  }
  if (!data) {
    failed++;
    console.log(`FAIL ${dir} — config.ts must export WORLD_DATA`);
    continue;
  }
  if (data.config.nodeId !== dir) {
    failed++;
    console.log(`FAIL ${dir} — config.nodeId "${data.config.nodeId}" must equal its dir name`);
    continue;
  }
  seenNodeIds.push(data.config.nodeId);
  for (const b of data.config.buildings) {
    if (contentPartsFromRouteTarget(b.routeTarget)) seenContentTargets.add(b.routeTarget);
  }
  const problems = validateWorldData(data);
  if (problems.length > 0) {
    failed++;
    console.log(`FAIL ${data.config.nodeId} — ${problems.length} problem(s):`);
    for (const p of problems) console.log(`  - ${p}`);
  } else {
    const c = data.config;
    console.log(
      `PASS ${c.nodeId} — ${c.buildings.length} buildings, ${c.npcs.length} npcs${data.walk ? ', walk' : ''}`
    );
  }
}

for (const id of EXPECTED_NODE_IDS) {
  if (!seenNodeIds.includes(id)) {
    failed++;
    console.log(`FAIL missing expected region "${id}" (dir deleted/renamed without updating EXPECTED_NODE_IDS?)`);
  }
}

// Allowlist hygiene: every grandfathered pending-content target must still be
// referenced by some building. A leftover entry means its building was
// renamed/removed — or its content shipped — without cleaning the debt list;
// fail so PENDING_CONTENT_TARGETS can only shrink, never rot.
for (const target of Object.keys(PENDING_CONTENT_TARGETS)) {
  if (!seenContentTargets.has(target)) {
    failed++;
    console.log(
      `FAIL stale pending-content entry "${target}" — no building references it; remove it from content/links.ts`
    );
  }
}

// Smriti-reads-aloud guard: every shipped discovery must narrate sanely —
// FactCard's "Suno" speaks discoveryNarration() verbatim, so an empty part
// (silent gap) or an over-long one (some TTS engines truncate long
// utterances) is a content bug this catches at CI time, for future regions'
// entries too (the id lists and this loop grow together).
const MAX_UTTERANCE_CHARS = 320;
let narrated = 0;
for (const target of [
  ...EXPLORE_CONTENT_IDS.map(id => `explore:${id}`),
  ...RECAP_CONTENT_IDS.map(id => `recap:${id}`),
]) {
  const d = getDiscoveryForRouteTarget(target);
  if (!d) {
    failed++;
    console.log(`FAIL ${target} — shipped id has no registry entry (satisfies-lock should forbid this)`);
    continue;
  }
  const parts = discoveryNarration(d);
  const problems: string[] = [];
  if (parts.length !== d.sections.length + 2)
    problems.push(`expected intro + ${d.sections.length} sections + fun fact, got ${parts.length} parts`);
  parts.forEach((p, i) => {
    if (!p.trim()) problems.push(`part ${i} is empty (silent gap in the reading)`);
    if (p.length > MAX_UTTERANCE_CHARS)
      problems.push(`part ${i} is ${p.length} chars (> ${MAX_UTTERANCE_CHARS} — may get cut off mid-sentence)`);
  });
  if (!parts[0]?.includes(d.intro)) problems.push('narration must start with the card intro');
  if (!parts[parts.length - 1]?.includes(d.funFact))
    problems.push('narration must end with the fun-fact box');
  if (problems.length > 0) {
    failed++;
    console.log(`FAIL ${target} narration — ${problems.join('; ')}`);
  } else {
    narrated++;
  }
}
console.log(`PASS narration — ${narrated} discovery card(s) read aloud cleanly (parts ≤ ${MAX_UTTERANCE_CHARS} chars)`);

// Pregenerated narration audio (one consistent Smriti voice on every
// device) is a SOFT expectation: live TTS voices any card without a file,
// so a missing mp3 warns but never gates — new content ships text-first,
// audio follows when generated. Files map by content id (narrationAudio.ts).
const audioDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/assets/audio/narration'
);
const missingAudio = [...EXPLORE_CONTENT_IDS, ...RECAP_CONTENT_IDS].filter(
  id => !existsSync(path.join(audioDir, `${id}.mp3`))
);
if (missingAudio.length > 0) {
  console.log(
    `WARN narration-audio — ${missingAudio.length} shipped card(s) have no pregenerated Smriti audio yet (live TTS will voice them): ${missingAudio.join(', ')}`
  );
} else {
  console.log('PASS narration-audio — every shipped card has pregenerated Smriti audio');
}

console.log(
  `verify-world-data: ${seenNodeIds.length} regions checked, ${failed === 0 ? 'all valid' : `${failed} FAILED`}`
);
if (failed > 0) process.exitCode = 1;
