import { useGame } from '@/game/store';
import { Sparkles } from 'lucide-react';
import { useMemo } from 'react';

/**
 * Time Rift sidebar — the reference art bakes a region panel into the
 * painting, but its numbers (restoration %, memories, next reward) must
 * stay LIVE, so this fully-opaque DOM panel sits exactly over the painted
 * one (hiding it) and re-renders the same layout from real game state.
 * Follows the hub InfoPanel's visual language (dark plate, gold corner
 * brackets) at the reference panel's larger size; the restoration ring is
 * teal→green per the rift concept art (the hub ring stays gold). No
 * "View Chapter" CTA here — the reference panel ends at the reward block.
 */
export function RiftInfoPanel() {
  const { state } = useGame();
  const node = useMemo(
    () => state.nodes.find(n => n.id === state.selectedNodeId),
    [state.nodes, state.selectedNodeId]
  );
  if (!node) return null;

  const CIRC = 2 * Math.PI * 30;

  return (
    <div
      data-testid="rift-info-panel"
      className="absolute left-[20px] top-[87px] w-[187px] h-[424px] bg-[#0a0907] border border-primary/35 rounded-lg z-40 p-[12px] flex flex-col items-center text-center shadow-2xl"
    >
      {/* Corner brackets (hub InfoPanel language) */}
      <div className="absolute top-[3px] left-[3px] w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
      <div className="absolute top-[3px] right-[3px] w-[10px] h-[10px] border-t-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />
      <div className="absolute bottom-[3px] left-[3px] w-[10px] h-[10px] border-b-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
      <div className="absolute bottom-[3px] right-[3px] w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />

      <span className="text-[7px] text-primary/90 uppercase tracking-[0.14em] font-medium mt-[4px] block">
        {node.eyebrow}
      </span>
      <h2 className="font-title-serif text-[15.5px] font-bold text-white uppercase tracking-wide mt-[3px] leading-tight text-glow">
        {node.site}
      </h2>
      <span className="text-[8px] text-primary block mt-[3px]">{node.dates}</span>

      <div className="w-[90%] h-px bg-primary/20 my-[9px]" />

      <p className="text-[7.5px] leading-[1.55] text-muted-foreground px-[2px]">{node.desc}</p>

      <div className="w-[90%] h-px bg-primary/20 my-[9px]" />

      <span className="text-[7px] text-muted-foreground uppercase tracking-widest mb-[7px]">
        Memory Restoration
      </span>

      {/* Progress ring — teal→green per the rift concept art */}
      <div className="relative w-[70px] h-[70px] flex items-center justify-center mb-[8px]">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 70 70">
          <defs>
            <linearGradient id="rift-ring" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38d6c4" />
              <stop offset="100%" stopColor="#63cf52" />
            </linearGradient>
          </defs>
          <circle cx="35" cy="35" r="30" fill="none" stroke="currentColor" strokeWidth="3.5" className="text-black/60" />
          <circle
            cx="35"
            cy="35"
            r="30"
            fill="none"
            stroke="url(#rift-ring)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC - (CIRC * node.restorationPercent) / 100}
            className="transition-all duration-1000"
            style={{ filter: 'drop-shadow(0 0 4px rgba(56, 214, 196, 0.45))' }}
          />
        </svg>
        <div className="absolute inset-[4px] rounded-full border border-white/5" />
        <span className="font-serif text-[16px] font-bold text-foreground drop-shadow-md">
          {node.restorationPercent}%
        </span>
      </div>

      <span className="text-[7px] text-muted-foreground tracking-widest mb-[2px]">
        MEMORIES RESTORED
      </span>
      <span className="text-[11px] text-white tracking-widest font-medium mb-[7px]">
        {node.memoriesFound} <span className="text-muted-foreground">/ {node.memoriesTotal}</span>
      </span>

      {/* Reward block hugs the panel bottom, like the reference art */}
      <div className="flex-1" />
      <div className="w-[90%] h-px bg-primary/20 mb-[7px]" />

      <div className="flex flex-col items-start w-full text-left mb-[4px]">
        <span className="text-[7px] uppercase tracking-widest text-muted-foreground mb-[7px] text-center w-full">
          Next Memory Reward
        </span>
        <div className="flex items-center gap-[7px] w-full px-[4px]">
          <div className="w-[27px] h-[27px] rounded-sm bg-black/60 border border-primary/40 shrink-0 flex items-center justify-center relative overflow-hidden">
            <Sparkles className="w-[13px] h-[13px] text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[8.5px] font-bold text-white block mb-[2px] leading-tight truncate">
              {node.rewardName}
            </span>
            {node.rewardPerks.map((perk, i) => (
              <span key={i} className="text-[7px] text-primary block leading-tight">
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
