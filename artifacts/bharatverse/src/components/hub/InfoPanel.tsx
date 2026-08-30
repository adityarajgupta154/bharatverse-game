import { useGame } from '@/game/store';
import { Lock, Sparkles, BookOpen } from 'lucide-react';
import { Link } from 'wouter';
import React, { useMemo } from 'react';

export function InfoPanel() {
  const { state } = useGame();
  const node = useMemo(() => state.nodes.find(n => n.id === state.selectedNodeId), [state.nodes, state.selectedNodeId]);
  if (!node) return null;

  return (
    <div className="absolute left-[20px] top-[88px] w-[156px] h-[390px] bg-[#0a0907] border border-primary/35 rounded-lg z-40 p-[10px] flex flex-col items-center text-center shadow-2xl pointer-events-auto">
      {/* Corner brackets */}
      <div className="absolute top-[3px] left-[3px] w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
      <div className="absolute top-[3px] right-[3px] w-[10px] h-[10px] border-t-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />
      <div className="absolute bottom-[3px] left-[3px] w-[10px] h-[10px] border-b-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
      <div className="absolute bottom-[3px] right-[3px] w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />

      <span className="text-[6.5px] text-primary/90 uppercase tracking-[0.14em] font-medium mt-[2px] block">{node.eyebrow}</span>
      <h2 className="font-title-serif text-[13.5px] font-bold text-white uppercase tracking-wide mt-[2px] leading-tight text-glow">{node.site}</h2>
      <span className="text-[7px] text-primary block mt-[2px]">{node.dates}</span>
      
      <div className="w-[90%] h-px bg-primary/20 my-[8px]" />
      
      <p className="text-[7px] leading-[1.5] text-muted-foreground px-[2px]">{node.desc}</p>
      
      <div className="w-[90%] h-px bg-primary/20 my-[8px]" />

      <span className="text-[6.5px] text-muted-foreground uppercase tracking-widest mb-[6px]">Memory Restoration</span>
      
      {/* Progress Ring */}
      <div className="relative w-[62px] h-[62px] flex items-center justify-center mb-[8px]">
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="31" cy="31" r="27" fill="none" stroke="currentColor" strokeWidth="3" className="text-black/60" />
          <circle cx="31" cy="31" r="27" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="169.64" strokeDashoffset={169.64 - (169.64 * node.restorationPercent) / 100} className="text-primary transition-all duration-1000" style={{ filter: "drop-shadow(0 0 3px rgba(212, 175, 55, 0.4))" }} />
        </svg>
        <div className="absolute inset-[3px] rounded-full border border-white/5" />
        <span className="font-serif text-[14px] font-bold text-foreground drop-shadow-md">{node.restorationPercent}%</span>
      </div>

      <span className="text-[6.5px] text-muted-foreground tracking-widest mb-[2px]">MEMORIES RESTORED</span>
      <span className="text-[10px] text-white tracking-widest font-medium mb-[6px]">{node.memoriesFound} <span className="text-muted-foreground">/ {node.memoriesTotal}</span></span>

      <div className="w-[90%] h-px bg-primary/20 mb-[6px]" />

      <div className="flex flex-col items-start w-full text-left">
        <span className="text-[6.5px] uppercase tracking-widest text-muted-foreground mb-[6px] text-center w-full">Next Memory Reward</span>
        <div className="flex items-center gap-[6px] w-full px-[4px]">
          <div className="w-[24px] h-[24px] rounded-sm bg-black/60 border border-primary/40 shrink-0 flex items-center justify-center relative overflow-hidden">
            <Sparkles className="w-[12px] h-[12px] text-primary/70" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[8px] font-bold text-white block mb-[2px] leading-tight truncate">{node.rewardName}</span>
            {node.rewardPerks.map((perk, i) => (
              <span key={i} className="text-[6.5px] text-primary block leading-tight">{perk}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1" />

      {node.status === 'locked' ? (
        <button disabled className="w-[116px] h-[22px] rounded-full border border-white/10 bg-black/40 text-muted-foreground text-[8px] uppercase tracking-widest font-bold flex items-center justify-center gap-[6px] cursor-not-allowed mb-[4px]">
          <Lock className="w-[10px] h-[10px]" />
          Locked
        </button>
      ) : (
        <Link href={`/chapter/${node.id}`} className="w-[116px] h-[22px] rounded-full border border-primary bg-transparent hover:bg-primary/20 text-primary hover:text-primary-foreground text-[8px] uppercase tracking-widest font-bold flex items-center justify-center gap-[6px] transition-all duration-300 mb-[4px] box-glow">
          <BookOpen className="w-[10px] h-[10px]" />
          View Chapter
        </Link>
      )}
    </div>
  );
}
