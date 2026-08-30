import { MapStage } from '@/components/hub/MapStage';
import { InfoPanel } from '@/components/hub/InfoPanel';
import { SmritiDialogue } from '@/components/hub/SmritiDialogue';
import { LegendBar } from '@/components/hub/LegendBar';
import { RightControls } from '@/components/hub/RightControls';

export default function Hub() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <MapStage />
      <div className="pointer-events-auto relative z-10">
        <InfoPanel />
        <SmritiDialogue />
        <LegendBar />
        <RightControls />
      </div>
    </div>
  );
}
