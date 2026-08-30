export type NodeStatus = 'explored' | 'in_progress' | 'locked';

export interface GameNode {
  id: string;
  label: string;
  subtitle: string;
  
  eyebrow: string;
  site: string;
  dates: string;
  desc: string;
  
  status: NodeStatus;
  restorationPercent: number;
  memoriesFound: number;
  memoriesTotal: number;
  
  rewardName: string;
  rewardPerks: string[];
  
  unlockHint?: string;
  /** Clickable gate zone over the baked hub art, in 1024x592 stage px. */
  hotspot: { cx: number; cy: number; w: number; h: number };
  smritiLine: string;
  smritiLockedLine?: string;
}

export const GAME_NODES: GameNode[] = [
  {
    id: 'sindhu-ghati',
    label: 'Sindhu Ghati',
    subtitle: 'Gateway to the Civilization',
    eyebrow: 'Indus Valley Civilization',
    site: 'Mohenjo-Daro',
    dates: '3000 BCE – 1900 BCE',
    status: 'explored',
    restorationPercent: 42,
    memoriesFound: 18,
    memoriesTotal: 42,
    desc: 'Yah shahar apni unnath jal pranali, vyapar, kala aur yogya nagar yojana ke liye jaana jata tha.',
    rewardName: 'Indus Script Mysteries',
    rewardPerks: ['+1 Memory Fragment', '+25 Resonance'],
    hotspot: { cx: 322, cy: 200, w: 200, h: 170 },
    smritiLine: 'Naksha bhool raha hai, Aru. Chal ke har dwar tak jao.',
  },
  {
    id: 'magadha-kaal',
    label: 'Magadha Kaal',
    subtitle: 'Coming Soon',
    eyebrow: 'Mahajanapada Yug',
    site: 'Rajgir–Pataliputra',
    dates: '600 BCE – 300 BCE',
    status: 'locked',
    restorationPercent: 0,
    memoriesFound: 0,
    memoriesTotal: 36,
    desc: 'Mahajanapadon ka yug — Nalanda ke gyan aur Maurya shakti ki neev yahin padi.',
    rewardName: 'Lion Capital',
    rewardPerks: ['+1 Memory Fragment', '+20 Resonance'],
    unlockHint: 'Sindhu Ghati 60% restore karke kholo',
    hotspot: { cx: 752, cy: 195, w: 210, h: 170 },
    smritiLine: 'Gyan ki dharti par chalte hain.',
    smritiLockedLine: 'Yeh dwar abhi bandh hai, Aru. Pehle Sindhu Ghati aur yaadein lauta.',
  },
  {
    id: 'kala-bhoomi',
    label: 'Kala Bhoomi',
    subtitle: 'Crafts & Creations',
    eyebrow: 'Kala aur Shilp',
    site: 'Shilpgram',
    dates: 'Timeless',
    status: 'locked',
    restorationPercent: 0,
    memoriesFound: 0,
    memoriesTotal: 28,
    desc: 'Bharat ke shilp, rang aur bunai ki dharti — har dhaaga ek kahani kehta hai.',
    rewardName: 'Peacock Loom',
    rewardPerks: ['+1 Craft Token', '+15 Resonance'],
    unlockHint: 'Apni Parampara poori karke kholo',
    hotspot: { cx: 313, cy: 390, w: 210, h: 170 },
    smritiLine: 'Rang aur roop ka kamaal yahan dekh.',
    smritiLockedLine: 'Yeh dwar abhi bandh hai, Aru. Pehle paramparao ko poora kar.',
  },
  {
    id: 'apni-parampara',
    label: 'Apni Parampara',
    subtitle: 'Add Your Heritage — Andar Chalo',
    eyebrow: 'Tyohar aur Riti-Riwaz',
    site: 'Utsav Aangan',
    dates: 'Living Tradition',
    status: 'in_progress',
    restorationPercent: 10,
    memoriesFound: 3,
    memoriesTotal: 30,
    desc: 'Hamare tyohar, sangeet aur riwaaz — jeeti jaagti virasat.',
    rewardName: 'Festival Bell',
    rewardPerks: ['+1 Harmony Fragment', '+10 Resonance'],
    hotspot: { cx: 517, cy: 420, w: 220, h: 180 },
    smritiLine: 'Utsav ki dhun ka anand le, Aru.',
  },
  {
    id: 'khel-maidan',
    label: 'Khel Maidan',
    subtitle: 'Traditional Games',
    eyebrow: 'Paramparik Khel',
    site: 'Akhada',
    dates: 'Ancient to Modern',
    status: 'locked',
    restorationPercent: 0,
    memoriesFound: 0,
    memoriesTotal: 24,
    desc: 'Kabaddi, kho-kho aur mallakhamb — maidan ki apni paathshala.',
    rewardName: 'Victory Toran',
    rewardPerks: ['+1 Strength Fragment', '+10 Resonance'],
    unlockHint: 'Koi bhi 2 kshetra explore karke kholo',
    hotspot: { cx: 745, cy: 390, w: 210, h: 170 },
    smritiLine: 'Maidan ki pukaar, sun raha hai tu?',
    smritiLockedLine: 'Yeh dwar abhi bandh hai, Aru. Kuch aur kshetra explore kar.',
  }
];

export interface PlayerState {
  name: string;
  level: number;
  xp: number;
  maxXp: number;
}

export const INITIAL_PLAYER: PlayerState = {
  name: 'Aru',
  level: 8,
  xp: 850,
  maxXp: 1500
};
