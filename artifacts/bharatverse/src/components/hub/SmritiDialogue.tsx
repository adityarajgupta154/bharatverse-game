import { useGame } from '@/game/store';
import smritiFrame from '@/assets/images/ui/smriti-frame.png';
import { useEffect, useState } from 'react';

export function SmritiDialogue({ line }: { line?: string }) {
  const { state } = useGame();
  const selectedNode = state.nodes.find(n => n.id === state.selectedNodeId);

  const [displayText, setDisplayText] = useState('');
  const [typing, setTyping] = useState(false);

  const fullText =
    line ??
    (selectedNode
      ? (selectedNode.status === 'locked' && selectedNode.smritiLockedLine ? selectedNode.smritiLockedLine : selectedNode.smritiLine)
      : 'Naksha bhool raha hai, Aru. Chal ke har dwar tak jao.');

  useEffect(() => {
    setDisplayText('');
    setTyping(true);
    let i = 0;
    const interval = setInterval(() => {
      setDisplayText(fullText.slice(0, i));
      i++;
      if (i > fullText.length) {
        setTyping(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  }, [fullText]);

  return (
    <div className="absolute left-[6px] top-[504px] w-[258px] h-[80px] z-40" aria-live="polite">
      {/* Box frame, portrait, SMRITI label and speaker icons — cut from reference art (dialogue area blanked) */}
      <img src={smritiFrame} alt="" className="absolute inset-0 w-full h-full pointer-events-none select-none" draggable={false} />

      {/* Live dialogue text over the blanked area */}
      <p
        className="absolute left-[78px] top-[23px] w-[128px]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontSize: '9.5px', lineHeight: '15px', color: '#F0E7D4' }}
      >
        {displayText}
        {typing && <span className="inline-block w-[3px] h-[10px] bg-primary/60 ml-[2px] align-middle" />}
      </p>
    </div>
  );
}
