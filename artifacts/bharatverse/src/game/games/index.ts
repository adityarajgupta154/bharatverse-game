import aruSprite from '@/assets/images/aru-sprite-cut.png';
import { createCityBuilderScene } from './city-builder-scene';
import { createDrainPuzzleScene } from './drain-puzzle-scene';
import { createPothiKhojScene } from './pothi-khoj-scene';
import { createRangoliRangScene } from './rangoli-rang-scene';
import { createDiyeJalaoScene } from './diye-jalao-scene';
import { createKhoKhoDaudScene } from './kho-kho-daud-scene';
import type { GameDef } from './types';
import { GAME_BUILDINGS, gameIdFromRouteTarget, type GameId } from './links';

export type { GameDef, Scene, SceneHud } from './types';

/**
 * Minigame registry.
 *
 * A building's routeTarget "minigame:<id>" / "builder:<id>" / "climax:<id>"
 * launches GAMES[<id>] at /world/<nodeId>/game/<id>. Sindhu Ghati has two
 * real games (Naali Paheli, Sheher Banao); each other region ships its own
 * playable finale as its climax building.
 */
const GAMES_REGISTRY = {
  'drain-puzzle': {
    id: 'drain-puzzle',
    buildingId: GAME_BUILDINGS['drain-puzzle'],
    title: 'Naali Paheli',
    subtitle: 'Paani ko Raasta Do',
    intro: [
      'Baarish aane wali hai — aur sheher ki naali 5 jagah se tooti padi hai!',
      'Galiyon mein bikhre naali ke tukde dhoondo, utha kar chamakti khaali jagahon par lagao, aur kuen ka paani nadi tak pahunchao.',
      'Dhyan se — seedhe tukde seedhi jagah par lagte hain, aur mude (L) tukde modon par!',
    ],
    winLine: 'Naali jud gayi — paani nadi tak pahunch gaya. Sheher bach gaya!',
    imageSrcs: { aru: aruSprite },
    createScene: createDrainPuzzleScene,
  },
  'city-builder': {
    id: 'city-builder',
    buildingId: GAME_BUILDINGS['city-builder'],
    title: 'Sheher Banao',
    subtitle: 'Naya Mohalla',
    intro: [
      'Nadi ke kinare naya mohalla basana hai — 6 khaali plot taiyaar pade hain!',
      'Sheher mein saman ke gatthe bikhre hain — eetein, anaaj, paani ki eentein, bazaar ka saman. Har gattha utha kar uske ICON wale chamakte plot par lagao.',
      'Mohenjo-Daro ke log seedhi grid galiyon mein sheher basate the — tum bhi waise hi basao!',
    ],
    winLine: 'Naya mohalla taiyaar! Tumne Mohenjo-Daro ki tarah grid-planning se sheher basaya.',
    imageSrcs: { aru: aruSprite },
    createScene: createCityBuilderScene,
  },
  'pothi-khoj': {
    id: 'pothi-khoj',
    buildingId: GAME_BUILDINGS['pothi-khoj'],
    title: 'Pothi Khoj',
    subtitle: 'Gyan ka Bhandaar',
    intro: [
      'Toofan ne Nalanda ke Dharmaganja pustakalaya ki pothiyan bikher di hain!',
      'Aangan me bikhri 6 pothiyan uthao aur har ek ko uske ICON wale taak par rakho — patta ayurveda ka, shunya ganit ka, taara jyotish ka.',
      'Nalanda me 10,000 vidyarthi padhte the — unka gyan ab tumhare haath me hai!',
    ],
    winLine: 'Dharmaganja phir se saj gaya! Nalanda ka gyan ab surakshit hai — shabash!',
    imageSrcs: { aru: aruSprite },
    createScene: createPothiKhojScene,
  },
  'rangoli-rang': {
    id: 'rangoli-rang',
    buildingId: GAME_BUILDINGS['rangoli-rang'],
    title: 'Rangoli Rang',
    subtitle: 'Aangan ke Rang',
    intro: [
      'Shilpgram ke aangan ki badi rangoli adhoori reh gayi — rang ke matke idhar-udhar kho gaye hain!',
      '6 matke dhoondo aur rangoli ke BEECH me jaakar dalo — pehle LAAL, phir PEELA, phir NEELA. Andar se bahar, yahi rangoli ka niyam hai!',
      'Har rang dharti se banta hai — haldi, neel, majith. Khelte-khelte dekho kaun sa rang kahan se aaya!',
    ],
    winLine: 'Rangoli poori hui — aangan jagmaga utha! Tumne desi rangon ka raaz bhi seekh liya.',
    imageSrcs: { aru: aruSprite },
    createScene: createRangoliRangScene,
  },
  'diye-jalao': {
    id: 'diye-jalao',
    buildingId: GAME_BUILDINGS['diye-jalao'],
    title: 'Diye Jalao',
    subtitle: 'Roshni ki Raat',
    intro: [
      'Utsav ki raat aa gayi hai — par aangan ke 6 diye abhi tak bujhe pade hain!',
      'Beech wale AKHAND JYOT se lau lo (E/Space) aur sambhal kar kisi diye tak le jao. Ek baar me ek hi lau — diya jala toh wapas jyot ke paas!',
      'Har diya ek tyohar ki yaad jalayega — Diwali se Pongal tak!',
    ],
    winLine: 'Saare diye jal utthe — aangan roshan, utsav shuru! Andhere par ujale ki jeet!',
    imageSrcs: { aru: aruSprite },
    createScene: createDiyeJalaoScene,
  },
  'kho-kho-daud': {
    id: 'kho-kho-daud',
    buildingId: GAME_BUILDINGS['kho-kho-daud'],
    title: 'Kho-Kho Daud',
    subtitle: 'Khambon ki Race',
    intro: [
      'Akhade me kho-kho ke 8 khambe khade hain — aur sirf CHAMAKTA khamba hi ginta hai!',
      'Jo khamba chamke uske paas daud kar E/Space dabao. Ek ke baad ek, 1 se 8 tak — khambon ki line ke aar-paar daudte hue!',
      'Asli kho-kho khiladi aise hi khambon ke beech daudte hain — tez, par soch kar!',
    ],
    winLine: 'Daud poori — 8 ke 8 khambe chhoo liye! Maidan ne tumhe apna khiladi maan liya.',
    imageSrcs: { aru: aruSprite },
    createScene: createKhoKhoDaudScene,
  },
} satisfies { [K in GameId]: GameDef & { id: K } };

/**
 * String-indexed view for route-param lookups. The `satisfies` above locks
 * this registry to links.ts at COMPILE time (root typecheck, which CI runs):
 * every GAME_BUILDINGS key must have an entry here, no extra entries are
 * allowed, and each entry's `id` must equal its key. So the pure mirror that
 * headless world-data validation reads (links.ts — this module can't be
 * imported under tsx, the aru sprite is a vite asset) can never drift from
 * the executable registry without breaking the build.
 */
export const GAMES: Record<string, GameDef> = GAMES_REGISTRY;

/**
 * "minigame:drain-puzzle" -> GAMES['drain-puzzle'] (null when unregistered).
 * The `climax:` namespace may also carry a game: in the four single-game
 * worlds the playable finale IS the climax building, so winning it fires the
 * node's region-restore (GameScreen checks building.type === 'climax').
 */
export function getGameForRouteTarget(routeTarget: string): GameDef | null {
  const id = gameIdFromRouteTarget(routeTarget);
  return id ? GAMES[id] : null;
}
