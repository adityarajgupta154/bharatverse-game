import aruSprite from '@/assets/images/aru-sprite-cut.png';
import { createDemoScene } from './demo-scene';
import type { GameDef } from './types';

export type { GameDef, Scene, SceneHud } from './types';

/**
 * Minigame registry (Minigames Phase Task 0).
 *
 * A building's routeTarget "minigame:<id>" / "builder:<id>" launches
 * GAMES[<id>] at /world/<nodeId>/game/<id>. Both games currently mount the
 * Task-0 framework demo scene; the real Naali Paheli and Sheher Banao scenes
 * replace `createScene` in their own tasks without touching any wiring.
 */
export const GAMES: Record<string, GameDef> = {
  'drain-puzzle': {
    id: 'drain-puzzle',
    buildingId: 'naali-paheli',
    title: 'Naali Paheli',
    subtitle: 'Paani ko Raasta Do',
    intro: [
      'Baarish aane wali hai — aur sheher ki naali tooti padi hai!',
      'Galiyon mein bikhre naali ke tukde dhoondo, utha kar chamakti khaali jagahon par lagao, aur kuen ka paani nadi tak pahunchao.',
    ],
    winLine: 'Naali jud gayi — paani nadi tak pahunch gaya. Sheher bach gaya!',
    imageSrcs: { aru: aruSprite },
    createScene: createDemoScene,
  },
  'city-builder': {
    id: 'city-builder',
    buildingId: 'sheher-banao',
    title: 'Sheher Banao',
    subtitle: 'Naya Mohalla',
    intro: [
      'Nadi ke kinare ek naya mohalla basana hai — magar monsoon door nahi.',
      'Abhi ke liye: naali ke tukde jod kar dikhao ki paani ko raasta dena aata hai. (Asli builder khel agle update mein aa raha hai!)',
    ],
    winLine: 'Shabash! Ab tum sheher basane ke liye taiyaar ho.',
    imageSrcs: { aru: aruSprite },
    createScene: createDemoScene,
  },
};

/** "minigame:drain-puzzle" -> GAMES['drain-puzzle'] (null when unregistered). */
export function getGameForRouteTarget(routeTarget: string): GameDef | null {
  const sep = routeTarget.indexOf(':');
  if (sep < 0) return null;
  const ns = routeTarget.slice(0, sep);
  const id = routeTarget.slice(sep + 1);
  if (ns !== 'minigame' && ns !== 'builder') return null;
  return GAMES[id] ?? null;
}
