import { useGame } from '@/game/store';
import smritiFrame from '@/assets/images/ui/smriti-frame.png';
import { useEffect, useState } from 'react';
import { useSpeech } from '@/lib/useSpeech';

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

  // The frame art paints a speaker glyph beside Smriti's portrait — this
  // makes it real: tapping it has didi read the current line aloud (early
  // readers). The button is a transparent hit-area OVER the painted glyph,
  // so the reference art stays pixel-identical.
  const { canListen, speaking, toggle, stop } = useSpeech();

  useEffect(() => {
    setDisplayText('');
    setTyping(true);
    // The line changed under didi (node click, card close) — a reading of
    // the OLD line would contradict the text now typing out, so stop it.
    stop();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the line itself; `stop` is a stable-enough per-render closure
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

      {/* Hit-area over the painted speaker glyph (right edge of the frame) */}
      {canListen && (
        <button
          onClick={() => toggle([fullText])}
          aria-pressed={speaking}
          aria-label={speaking ? 'Roko — Smriti didi ka bolna roko' : 'Suno — Smriti didi ki baat suno'}
          data-testid="smriti-listen"
          className={`absolute left-[203px] top-[31px] w-[48px] h-[26px] rounded-[5px] transition-colors ${
            speaking ? 'bg-primary/20 animate-pulse' : 'hover:bg-primary/10'
          }`}
        />
      )}
    </div>
  );
}
