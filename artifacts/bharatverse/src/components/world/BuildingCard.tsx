import { useEffect, useRef } from 'react';
import { X, Lock } from 'lucide-react';
import type { WorldBuilding, BuildingState, BuildingType } from '@/game/world-types';

const TYPE_META: Record<BuildingType, { label: string; line: string }> = {
  explore: {
    label: 'Khoj Sthal',
    line: 'Yahan ki yaadein jald khulengi — khoj shuru hone wali hai.',
  },
  minigame: {
    label: 'Khel',
    line: 'Yeh khel jald shuru hoga. Taiyaar raho!',
  },
  builder: {
    label: 'Nirmaan',
    line: 'Apna sheher banane ka mauka jald milega.',
  },
  climax: {
    label: 'Antim Raaz',
    line: 'Sheher ka sabse gehra raaz — saari yaadein lautao, tab yeh dwar khulega.',
  },
  narrative_gate: {
    label: 'Kahani',
    line: 'Duniya ke pehle planned sheher ki kahani yahin se shuru hoti hai.',
  },
};

/**
 * Placeholder activation card (Task 2 wiring): shows what a building is and,
 * when locked, exactly what still has to be finished. Real experiences
 * (fact cards, minigames, builder, climax) replace the body in later tasks.
 */
export function BuildingCard({
  building,
  state,
  pendingNames,
  onClose,
}: {
  building: WorldBuilding;
  state: BuildingState;
  /** Names of buildings still pending when this one is locked. */
  pendingNames: string[];
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Modal focus: move focus in on open, restore on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => prev?.focus();
  }, []);

  // ESC closes; Tab is trapped inside the dialog.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !cardRef.current) return;
      const focusables = cardRef.current.querySelectorAll<HTMLElement>(
        'button, a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      if (!cardRef.current.contains(active)) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const meta = TYPE_META[building.type];
  const locked = state === 'locked';

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center pointer-events-auto"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55" />
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-label={building.name}
        onClick={e => e.stopPropagation()}
        className="relative w-[290px] bg-[#0a0907] border border-primary/40 rounded-lg p-[14px] text-center shadow-2xl"
      >
        {/* Corner brackets — same visual language as the info panel */}
        <div className="absolute top-[3px] left-[3px] w-[10px] h-[10px] border-t-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
        <div className="absolute top-[3px] right-[3px] w-[10px] h-[10px] border-t-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />
        <div className="absolute bottom-[3px] left-[3px] w-[10px] h-[10px] border-b-[1.5px] border-l-[1.5px] border-primary pointer-events-none" />
        <div className="absolute bottom-[3px] right-[3px] w-[10px] h-[10px] border-b-[1.5px] border-r-[1.5px] border-primary pointer-events-none" />

        <button
          ref={closeRef}
          aria-label="Band karo"
          onClick={onClose}
          className="absolute top-[6px] right-[6px] w-[16px] h-[16px] flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
        >
          <X className="w-[11px] h-[11px]" />
        </button>

        <span className="text-[6.5px] text-primary/90 uppercase tracking-[0.16em] font-medium">
          {meta.label}
        </span>
        <h2 className="font-title-serif text-[14px] font-bold text-white tracking-wide mt-[3px] leading-tight text-glow">
          {building.name}
        </h2>
        <span className="text-[7.5px] text-primary/80 block mt-[2px]">{building.subtitle}</span>

        <div className="w-[85%] h-px bg-primary/20 my-[10px] mx-auto" />

        {locked ? (
          <>
            <div className="flex items-center justify-center gap-[5px] text-muted-foreground">
              <Lock className="w-[10px] h-[10px]" />
              <span className="text-[8.5px] uppercase tracking-widest font-bold">Abhi bandh hai</span>
            </div>
            <p className="text-[7.5px] leading-[1.6] text-muted-foreground mt-[8px]">
              Yeh dwar tabhi khulega jab yeh sab poora hoga:
            </p>
            <ul className="mt-[6px] space-y-[3px]">
              {pendingNames.map(n => (
                <li key={n} className="text-[7.5px] text-primary/90">
                  ◆ {n}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p className="text-[8px] leading-[1.6] text-foreground/90 px-[6px]">{meta.line}</p>
            <span className="inline-block mt-[10px] text-[6.5px] uppercase tracking-[0.14em] text-primary border border-primary/40 rounded-full px-[8px] py-[3px]">
              Jald aa raha hai
            </span>
          </>
        )}
      </div>
    </div>
  );
}
