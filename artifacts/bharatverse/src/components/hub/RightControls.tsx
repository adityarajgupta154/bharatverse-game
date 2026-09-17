import { Link } from 'wouter';
import { useState, useRef, useEffect } from 'react';
import { useGame } from '@/game/store';
import { cn } from '@/lib/utils';
import { FILTER_DEFS } from './filter-defs';
import filterCut from '@/assets/images/ui/filter-cut.png';
import riftCut from '@/assets/images/ui/rift-cut.png';

export function RightControls() {
  const { state, toggleFilter } = useGame();
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div className="absolute left-[763px] top-[534px] w-[94px] h-[36px] z-40 pointer-events-auto" ref={filterRef}>
        <button
          onClick={() => setFilterOpen(!filterOpen)}
          aria-label="Filter map gates"
          aria-expanded={filterOpen}
          className="w-full h-full hover:brightness-110 transition-[filter] focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary/70"
        >
          <img src={filterCut} alt="" className="w-full h-full select-none" draggable={false} />
        </button>
        {filterOpen && (
          <div className="absolute bottom-full right-0 mb-[8px] w-[150px] bg-black/90 backdrop-blur-xl border border-card-border rounded-xl p-[6px] shadow-2xl">
            {FILTER_DEFS.map(f => {
              const isActive = state.activeFilters.includes(f.id);
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => toggleFilter(f.id)}
                  className={cn(
                    "w-full flex items-center gap-[6px] px-[8px] py-[6px] rounded-lg transition-colors text-[9px]",
                    isActive ? "bg-white/10" : "hover:bg-white/5 opacity-50"
                  )}
                >
                  <Icon className={cn("w-[12px] h-[12px]", f.color)} />
                  <span className="font-medium flex-1 text-left">{f.label}</span>
                  <div className={cn(
                    "w-[12px] h-[12px] rounded-sm border flex items-center justify-center transition-colors",
                    isActive ? "border-primary bg-primary/20" : "border-muted-foreground"
                  )}>
                    {isActive && <div className="w-[6px] h-[6px] bg-primary rounded-[1px]" />}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Link
        href="/oracle"
        aria-label="Time Rift"
        className="absolute left-[856px] top-[526px] w-[156px] h-[52px] z-40 pointer-events-auto hover:brightness-110 transition-[filter] focus-visible:outline focus-visible:outline-1 focus-visible:outline-primary/70"
      >
        <img src={riftCut} alt="" className="w-full h-full select-none" draggable={false} />
      </Link>
    </>
  );
}
