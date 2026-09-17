import {
  contentPartsFromRouteTarget,
  type ExploreContentId,
  type RecapContentId,
} from './links';

/**
 * Story-content registry — the WRITTEN discoveries behind explore:/recap:
 * routeTargets: fact cards (a building's memory, told as 3 kid-sized facts
 * plus a "Kya Jaante Ho?" hook) and story recaps (replayable narrative
 * beats). FactCard.tsx renders both.
 *
 * links.ts (the pure mirror the headless CI validator reads) declares WHICH
 * ids are shipped; the `satisfies` locks below make this module's keysets
 * equal to those id lists at COMPILE time (root typecheck = CI): a missing
 * entry, an extra entry, or an id that doesn't match its key is a tsc error
 * — same pattern as games/index.ts ⇄ games/links.ts. Shipping new content:
 * move the id out of PENDING_CONTENT_TARGETS in links.ts, then add the
 * entry here (each step alone fails the build, so the two can't drift).
 *
 * All copy is Hinglish, voiced for the game's 6–11 audience: short
 * sentences, wonder over jargon, and Smriti/Aru's "yaadein lautao" fantasy
 * framing memories, not lectures.
 */

/** One ◆ section on a discovery card: a tiny heading + 1–2 sentences. */
export interface FactCardSection {
  heading: string;
  body: string;
}

interface DiscoveryBase {
  /** Card title/subtitle — match the building's painted name plate. */
  title: string;
  subtitle: string;
  /** Small-caps eyebrow, e.g. "Safai ki Yaad". */
  kicker: string;
  /** Invitation line on the building's activation card (BuildingCard). */
  invite: string;
  /** Scene-setting first line of the card. */
  intro: string;
  sections: FactCardSection[];
  /** "Kya Jaante Ho?" (explore) / "Raaz ki Baat" (recap) box text. */
  funFact: string;
  /** Smriti's HUD line after the memory returns / the recap closes. */
  completeLine: string;
}

/** Explore fact card: reading it returns the building's memory. */
export interface FactCardDef extends DiscoveryBase {
  id: ExploreContentId;
  kind: 'explore';
}

/** Recap card: replayable story beats — nothing to complete. */
export interface RecapDef extends DiscoveryBase {
  id: RecapContentId;
  kind: 'recap';
}

export type DiscoveryDef = FactCardDef | RecapDef;

const EXPLORE_CONTENT = {
  'great-bath': {
    id: 'great-bath',
    kind: 'explore',
    title: 'Vishaal Snanagar',
    subtitle: 'The Great Bath',
    kicker: 'Paani ki Yaad',
    invite: 'Chamakti seedhiyan paani me utarti hain — is kund ka raaz jaanoge?',
    intro:
      'Beech sheher me chamakta vishaal kund — duniya ka sabse purana sarvajanik snanagar. Iski yaad ab lautne wali hai…',
    sections: [
      {
        heading: 'Kitna vishaal?',
        body: 'Ek bade classroom se bhi bada kund — 12 meter lamba, 7 meter chauda, aur kandhe tak gehra paani!',
      },
      {
        heading: 'Paani kaise ruka?',
        body: 'Pakki eenton ke upar taar-kol (bitumen) ki parat lagayi gayi — bina cement ke bhi ek boond nahi risti thi.',
      },
      {
        heading: 'Hota kya tha yahan?',
        body: 'Khaas mauqon par log yahan snan karte the. Paas ke kuen se paani aata, aur purani naali se bah jaata.',
      },
    ],
    funFact:
      '4500 saal baad bhi is kund ki eentein apni jagah majboot khadi hain — aaj bhi Mohenjo-Daro jaakar tum ise dekh sakte ho!',
    completeLine: 'Snanagar ki yaad laut aayi — kund ka paani phir jhilmila utha!',
  },
  granary: {
    id: 'granary',
    kind: 'explore',
    title: 'Anaaj Bhandaar',
    subtitle: 'The Great Granary',
    kicker: 'Anaaj ki Yaad',
    invite: 'Itna bada godam, phir bhi koi taala nahi — andar ki yaad jagaoge?',
    intro:
      'Ooncha chabutara, moti deewarein — yeh tha sheher ka anaaj-ghar, poore Mohenjo-Daro ki rasoi ka bharosa.',
    sections: [
      {
        heading: 'Anaaj ka kila',
        body: 'Gehun aur jau yahan jama hote the — fasal kam ho ya zyada, sheher me koi bhookha nahi sota tha.',
      },
      {
        heading: 'Hawa ka jaadu',
        body: 'Farsh ke neeche hawa ke raste bane the taaki anaaj kabhi sade nahi — bina fridge ke itni pakki jugat!',
      },
      {
        heading: 'Har daana gina jaata',
        body: 'Log fasal jama karte aur zaroorat par lete. Anaaj rakshak ka hisaab pakka — har daane ka!',
      },
    ],
    funFact:
      'Itne bade bhandaar me kahin koi taala nahi mila — lagta hai poore sheher ka ek-doosre par pakka bharosa tha!',
    completeLine: 'Anaaj Bhandaar ki yaad laut aayi — bhandaar phir bhar gaya!',
  },
  'covered-drains': {
    id: 'covered-drains',
    kind: 'explore',
    title: 'Dhaki Naaliyon ki Gali',
    subtitle: 'Street of Covered Drains',
    kicker: 'Safai ki Yaad',
    invite: 'Gali ke neeche kya chhupa hai? Dhakkan hata kar dekho!',
    intro:
      'Is gali ke neeche chhupa hai ek anokha jaal — dhaki hui naaliyon ka. Duniya me aisa sabse pehle yahin bana!',
    sections: [
      {
        heading: 'Har ghar se juda',
        body: 'Har ghar ka apna snanghar tha, aur uska paani chhoti naali se gali ki badi naali me milta tha.',
      },
      {
        heading: 'Dhakkan kyun?',
        body: 'Naaliyan chapti pattharon se dhaki thin — na badbu, na machhar, aur galiyan hamesha saaf!',
      },
      {
        heading: 'Safai ki khidkiyan',
        body: 'Beech-beech me uthane wale dhakkan the — bilkul aaj ke manhole jaise — taaki naali saaf ho sake.',
      },
    ],
    funFact:
      'Aisi saaf-safai Europe ke shehron me iske hazaaron saal BAAD pahunchi — Mohenjo-Daro ke karigar time se kitne aage the!',
    completeLine: 'Naaliyon ki yaad laut aayi — galiyan phir chamak uthin!',
  },
  bazaar: {
    id: 'bazaar',
    kind: 'explore',
    title: 'Bazaar',
    subtitle: 'Trade & Exchange',
    kicker: 'Vyapar ki Yaad',
    invite: 'Mohrein, moti aur pardesi saudagar — bazaar ki raunak yaad karoge?',
    intro:
      'Shor, rang aur saudagar — bazaar me moti, tamba, kapaas sab bikta tha… aur saath me aati thin door desh ki kahaniyan.',
    sections: [
      {
        heading: 'Mohar ka thappa',
        body: "Har saudagar ki apni patthar ki mohar — us par jaanwar aur anokhe akshar. Saman par thappa yaani 'yeh mera hai'!",
      },
      {
        heading: 'Ek jaisa naap',
        body: 'Patthar ke chaukor baat sab bazaaron me EK jaise the — taraju par chhota-bada sab barabar.',
      },
      {
        heading: 'Samundar paar dosti',
        body: 'Yahan ke moti aur kapda naavon me door Mesopotamia tak jaate the — bina nakshe-GPS ke itna lamba safar!',
      },
    ],
    funFact:
      'Mohron par likhi Sindhu lipi aaj tak koi padh nahi paya. Ho sakta hai, ek din TUM padh lo!',
    completeLine: 'Bazaar ki yaad laut aayi — mohron ki chamak wapas aayi!',
  },
} satisfies { [K in ExploreContentId]: FactCardDef & { id: K } };

const RECAP_CONTENT = {
  'sindhu-intro': {
    id: 'sindhu-intro',
    kind: 'recap',
    title: 'Sheher ka Dwaar',
    subtitle: 'City Entry',
    kicker: 'Kahani — Shuruaat',
    invite: 'Yahin se safar shuru hua tha. Kahani phir se sunoge?',
    intro: 'Yaad karo, Aru — yeh safar shuru kaise hua tha…',
    sections: [
      {
        heading: 'Rift ke paar',
        body: 'Chamakta rift Aru ko 4500 saal peechhe le gaya — samne thi Sindhu Ghati ki sabse badi nagari, Mohenjo-Daro!',
      },
      {
        heading: 'Smriti ki Pukaar',
        body: "'Naksha bhool raha hai, Aru,' Smriti didi ne kaha. 'Is sheher ki yaadein bikhar gayi hain — tumhe unhe lautana hoga.'",
      },
      {
        heading: 'Pehla planned sheher',
        body: 'Seedhi grid galiyan, pakki eenton ke ghar, har ghar me naali — yeh sab 4500 saal pehle! Aisa sheher duniya ne pehle kabhi nahi dekha tha.',
      },
      {
        heading: 'Tumhara mission',
        body: 'Snanagar, Anaaj Bhandaar, Naaliyon ki Gali aur Bazaar ki yaadein lautao. Dono khel jeeto. Tab hi Aakhri Raaz ka darwaza khulega!',
      },
    ],
    funFact:
      "Is sheher ka asli naam aaj tak koi nahi jaanta! 'Mohenjo-Daro' toh baad ka naam hai — yahan ke log apne sheher ko kya bulate the, yeh raaz aaj bhi bandh hai.",
    completeLine: 'Kahani yaad rahe, Aru — har yaad ke saath naksha phir jaagega.',
  },
} satisfies { [K in RecapContentId]: RecapDef & { id: K } };

// String-indexed views for routeTarget lookups — the `satisfies` above lock
// the literals to links.ts; widening happens once, here (games/index.ts rule).
const EXPLORE_LOOKUP: Record<string, FactCardDef> = EXPLORE_CONTENT;
const RECAP_LOOKUP: Record<string, RecapDef> = RECAP_CONTENT;

/**
 * "explore:great-bath" → its FactCardDef, "recap:sindhu-intro" → its
 * RecapDef; null for game namespaces and for content ids that are still
 * PENDING_CONTENT_TARGETS debt (those keep the "Jald aa raha hai" chip).
 */
export function getDiscoveryForRouteTarget(routeTarget: string): DiscoveryDef | null {
  const parts = contentPartsFromRouteTarget(routeTarget);
  if (!parts) return null;
  return (parts.ns === 'explore' ? EXPLORE_LOOKUP[parts.id] : RECAP_LOOKUP[parts.id]) ?? null;
}
