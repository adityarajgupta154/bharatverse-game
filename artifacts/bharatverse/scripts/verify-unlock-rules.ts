/**
 * Proves every region's unlock rule is attainable through NORMAL play from a
 * fresh save — the exact progression chain a kid walks:
 *
 *   fresh save ──(win naali-paheli + sheher-banao)──▶ Magadha Kaal opens
 *   apni-parampara is open from the start ──(win diye-jalao ⇒ restoreNode)──▶
 *     Kala Bhoomi opens, and with Sindhu's initial `explored` that makes
 *     2 explored regions ──▶ Khel Maidan opens.
 *
 * Run: pnpm dlx tsx scripts/verify-unlock-rules.ts
 */
import { GAME_NODES, applyUnlockRules, type GameNode } from '../src/game/nodes';

let failures = 0;
function check(label: string, actual: unknown, expected: unknown) {
  const ok = actual === expected;
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label} (got ${String(actual)}, want ${String(expected)})`);
}

function statusOf(nodes: GameNode[], id: string): string {
  const n = nodes.find(x => x.id === id);
  if (!n) throw new Error(`unknown node ${id}`);
  return n.status;
}

// Simulates what restoreNode() persists for a region (store.tsx).
function restored(nodes: GameNode[], id: string): GameNode[] {
  return nodes.map(n =>
    n.id === id
      ? { ...n, status: 'explored' as const, restorationPercent: 100, memoriesFound: n.memoriesTotal }
      : n
  );
}

const fresh = GAME_NODES;

// 1. Fresh save: the three gated regions stay locked, Parampara is open.
{
  const d = applyUnlockRules(fresh, {});
  check('fresh: magadha locked', statusOf(d, 'magadha-kaal'), 'locked');
  check('fresh: kala locked', statusOf(d, 'kala-bhoomi'), 'locked');
  check('fresh: khel locked', statusOf(d, 'khel-maidan'), 'locked');
  check('fresh: parampara open', statusOf(d, 'apni-parampara') !== 'locked', true);
}

// 2. One Sindhu game won → Magadha still locked (needs both).
{
  const d = applyUnlockRules(fresh, { 'sindhu-ghati': ['naali-paheli'] });
  check('one sindhu game: magadha locked', statusOf(d, 'magadha-kaal'), 'locked');
}

// 3. Both Sindhu games won → Magadha opens (the normal-play path).
{
  const d = applyUnlockRules(fresh, { 'sindhu-ghati': ['naali-paheli', 'sheher-banao'] });
  check('both sindhu games: magadha open', statusOf(d, 'magadha-kaal'), 'in_progress');
  check('both sindhu games: kala still locked', statusOf(d, 'kala-bhoomi'), 'locked');
  check('both sindhu games: khel still locked', statusOf(d, 'khel-maidan'), 'locked');
}

// 4. Winning Diye Jalao (Parampara's climax) restores the region →
//    Kala Bhoomi opens, and 2 explored regions open Khel Maidan.
{
  const d = applyUnlockRules(restored(fresh, 'apni-parampara'), {
    'apni-parampara': ['diye-jalao'],
  });
  check('parampara restored: kala open', statusOf(d, 'kala-bhoomi'), 'in_progress');
  check('parampara restored: khel open', statusOf(d, 'khel-maidan'), 'in_progress');
  check('parampara restored: magadha still locked', statusOf(d, 'magadha-kaal'), 'locked');
}

// 5. Sindhu fully restored (its future finale) also opens Magadha.
{
  const d = applyUnlockRules(restored(fresh, 'sindhu-ghati'), {});
  check('sindhu restored: magadha open', statusOf(d, 'magadha-kaal'), 'in_progress');
}

// 6. Derivation never touches raw input or non-locked statuses.
{
  const before = JSON.stringify(fresh);
  applyUnlockRules(fresh, { 'sindhu-ghati': ['naali-paheli', 'sheher-banao'] });
  check('input untouched', JSON.stringify(fresh) === before, true);
  const d = applyUnlockRules(restored(fresh, 'apni-parampara'), {});
  check('explored stays explored', statusOf(d, 'apni-parampara'), 'explored');
}

if (failures > 0) {
  console.error(`\n${failures} unlock-rule check(s) FAILED`);
  process.exit(1);
}
console.log('\nPASS — every region unlock is reachable through normal play');
