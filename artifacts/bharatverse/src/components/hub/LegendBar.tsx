import legendCut from '@/assets/images/ui/legend-cut.png';

export function LegendBar() {
  return (
    <img
      src={legendCut}
      alt="Legend: Explored, In Progress, Locked, Story Mission"
      className="absolute left-[326px] top-[531px] w-[364px] h-[40px] z-40 pointer-events-none select-none"
      draggable={false}
    />
  );
}
