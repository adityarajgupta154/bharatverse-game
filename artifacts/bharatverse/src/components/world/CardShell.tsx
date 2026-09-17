import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

/**
 * Shared modal chrome for every story card in a world — the gold corner
 * brackets, dimmed backdrop, "Band karo" close button, ESC-to-close and the
 * Tab focus trap. BuildingCard and FactCard render through this shell (and
 * future card types — journal pages, rewards — should too) so an
 * accessibility fix or visual tweak lands on every card at once instead of
 * drifting across hand-maintained copies.
 *
 * Width/padding are passed as literal Tailwind classes (e.g. "w-[290px]")
 * so the JIT compiler sees them at the call site.
 */
export function CardShell({
  label,
  widthClass,
  paddingClass,
  initialFocusRef,
  onClose,
  children,
}: {
  /** Accessible dialog name (aria-label). */
  label: string;
  /** Literal width class for the card, e.g. "w-[290px]". */
  widthClass: string;
  /** Literal padding class for the card, e.g. "p-[14px]". */
  paddingClass: string;
  /**
   * Focused on open instead of the close button (focus returns to the
   * previously focused element on close either way).
   */
  initialFocusRef?: { readonly current: HTMLElement | null };
  onClose: () => void;
  children: ReactNode;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  // Modal focus: move focus in on open, restore on close.
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    (initialFocusRef?.current ?? closeRef.current)?.focus();
    return () => prev?.focus();
    // Mount-only on purpose: initial focus must not re-run on re-renders.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        aria-label={label}
        onClick={e => e.stopPropagation()}
        className={`relative ${widthClass} bg-[#0a0907] border border-primary/40 rounded-lg ${paddingClass} text-center shadow-2xl`}
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

        {children}
      </div>
    </div>
  );
}
