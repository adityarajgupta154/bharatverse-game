import { useGame } from '@/game/store';
import { Link, useLocation } from 'wouter';
import navBg from '@/assets/images/ui/nav-bg.png';
import gearCut from '@/assets/images/ui/gear-cut.png';
import tabMapGold from '@/assets/images/ui/tab-map-gold.png';
import tabMapGray from '@/assets/images/ui/tab-map-gray.png';
import tabJournalGold from '@/assets/images/ui/tab-journal-gold.png';
import tabJournalGray from '@/assets/images/ui/tab-journal-gray.png';
import tabPassportGold from '@/assets/images/ui/tab-passport-gold.png';
import tabPassportGray from '@/assets/images/ui/tab-passport-gray.png';
import tabCompGold from '@/assets/images/ui/tab-comp-gold.png';
import tabCompGray from '@/assets/images/ui/tab-comp-gray.png';
import tabHeritageGold from '@/assets/images/ui/tab-heritage-gold.png';
import tabHeritageGray from '@/assets/images/ui/tab-heritage-gray.png';

const SERIF = "Georgia, 'Times New Roman', serif";

// Geometry measured from the reference art (stage px)
const tabs = [
  { id: '/', label: 'Memory Map', center: 275.5, img: { left: 240, top: 8, w: 70, h: 48 }, gold: tabMapGold, gray: tabMapGray },
  { id: '/journal', label: 'Journal', center: 371, img: { left: 345, top: 8, w: 52, h: 48 }, gold: tabJournalGold, gray: tabJournalGray },
  { id: '/passport', label: 'Passport', center: 455, img: { left: 428, top: 8, w: 54, h: 48 }, gold: tabPassportGold, gray: tabPassportGray },
  { id: '/companions', label: "Aru's Companions", center: 558, img: { left: 509, top: 8, w: 98, h: 48 }, gold: tabCompGold, gray: tabCompGray },
  { id: '/heritage', label: 'Heritage Hub', center: 668.5, img: { left: 630, top: 8, w: 77, h: 48 }, gold: tabHeritageGold, gray: tabHeritageGray },
];

export function TopNav() {
  const { state } = useGame();
  const [location] = useLocation();

  return (
    <div className="absolute top-0 left-0 w-[1024px] h-[72px] border-b border-primary/20 z-50 pointer-events-auto">

      {/* Reference nav art as background (logo, inactive tabs, panel and gear baked in; dynamic zones blanked) */}
      <img src={navBg} alt="" className="absolute inset-0 w-[1024px] h-[72px] pointer-events-none select-none" draggable={false} />

      {/* Tabs */}
      {tabs.map(tab => {
        const isActive = location === tab.id;
        return (
          <Link
            key={tab.id}
            href={tab.id}
            aria-label={tab.label}
            aria-current={isActive ? 'page' : undefined}
            className="absolute top-0 h-[72px] w-[96px] -translate-x-1/2 group focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary/70"
            style={{ left: tab.center }}
          >
            {isActive && (
              <>
                {/* plaque */}
                <div className="absolute left-[0px] top-[5px] w-[96px] h-[61px] rounded-[3px] pointer-events-none" style={{ background: '#14130E', border: '1px solid rgba(217,178,93,0.32)', boxShadow: 'inset 0 0 14px rgba(0,0,0,0.55)' }} />
                {/* gold underline with centre diamond */}
                <div className="absolute top-[60px] left-1/2 -translate-x-1/2 w-[47px] h-[2px] pointer-events-none" style={{ background: '#DFB057', boxShadow: '0 0 6px rgba(223,176,87,0.55)' }} />
                <div className="absolute top-[58.5px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rotate-45 pointer-events-none" style={{ background: '#DFB057' }} />
              </>
            )}
            {!isActive && <div className="absolute inset-x-[4px] top-[5px] bottom-[6px] rounded-[3px] opacity-0 group-hover:opacity-100 transition-opacity bg-white/[0.04] pointer-events-none" />}
          </Link>
        );
      })}
      {/* Tab art (icon + label cut from reference). Inactive tabs are baked into the background,
          so live art is only needed for the active tab (gold) and the Memory Map tab (its zone is blanked). */}
      {tabs.map(tab => {
        const isActive = location === tab.id;
        if (!isActive && tab.id !== '/') return null;
        return (
          <img
            key={`img-${tab.id}`}
            src={isActive ? tab.gold : tab.gray}
            alt=""
            className="absolute pointer-events-none select-none"
            style={{ left: tab.img.left, top: tab.img.top, width: tab.img.w, height: tab.img.h }}
            draggable={false}
          />
        );
      })}
      <span className="absolute left-[852px] top-[12px] text-[12px] font-bold leading-none" style={{ fontFamily: SERIF, color: '#F3EFE6' }}>{state.player.name}</span>
      <span className="absolute left-[852px] top-[29px] text-[10px] leading-none" style={{ fontFamily: SERIF, color: '#86D3BF' }}>Level {state.player.level} Explorer</span>

      {/* XP Bar */}
      <div className="absolute left-[853px] top-[45px] w-[95px] h-[5px] rounded-full overflow-hidden" style={{ background: '#26241D' }}>
        <div className="h-full rounded-full" style={{ width: `${(state.player.xp / state.player.maxXp) * 100}%`, background: 'linear-gradient(to right, #C8963E, #F0C96A)' }} />
      </div>
      <span className="absolute left-[918px] top-[42px] w-[90px] text-right text-[9.5px] font-semibold leading-none" style={{ fontFamily: SERIF, color: '#EAE0CC' }}>{state.player.xp} / {state.player.maxXp} XP</span>

      {/* Settings */}
      <Link href="/settings" aria-label="Settings" className="absolute left-[990px] top-[7px] w-[29px] h-[29px] rounded-full hover:brightness-125 transition-[filter] focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary/70">
        <img src={gearCut} alt="" className="w-full h-full select-none" draggable={false} />
      </Link>
    </div>
  );
}
