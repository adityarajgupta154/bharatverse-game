import { CheckCircle2, Lock, Flame, Sparkles } from 'lucide-react';
import type { FilterCategory } from '@/game/nodes';

/**
 * One entry per legend chip / FILTER checkbox — the single source of truth
 * so the baked legend bar and the FILTER popover can never drift apart.
 * Colors echo the hover-glow tints (NodeBuilding GLOW / hub gate art).
 */
export const FILTER_DEFS: {
  id: FilterCategory;
  label: string;
  icon: typeof CheckCircle2;
  color: string;
}[] = [
  { id: 'explored', label: 'Explored', icon: CheckCircle2, color: 'text-emerald-400' },
  { id: 'in_progress', label: 'In Progress', icon: Flame, color: 'text-amber-400' },
  { id: 'locked', label: 'Locked', icon: Lock, color: 'text-muted-foreground' },
  { id: 'story_mission', label: 'Story Mission', icon: Sparkles, color: 'text-orange-400' },
];
