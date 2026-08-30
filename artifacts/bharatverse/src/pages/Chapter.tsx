import { useParams, Link, useLocation } from 'wouter';
import { useGame } from '@/game/store';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useEffect } from 'react';

export default function Chapter() {
  const { nodeId } = useParams<{ nodeId: string }>();
  const { state } = useGame();
  const [, setLocation] = useLocation();

  const node = state.nodes.find(n => n.id === nodeId);

  useEffect(() => {
    if (!node || node.status === 'locked') {
      setLocation('/');
    }
  }, [node, setLocation]);

  if (!node) return null;

  return (
    <div className="absolute top-[72px] bottom-0 left-0 right-0 bg-background flex flex-col relative overflow-hidden hub-gradient">
      
      {/* Minimal Header */}
      <div className="absolute top-0 left-0 right-0 h-[48px] nav-gradient z-50 flex items-center px-[32px]">
        <Link href="/" className="flex items-center gap-[8px] text-muted-foreground hover:text-primary transition-colors text-[10px] uppercase tracking-widest font-bold">
          <ArrowLeft className="w-[16px] h-[16px]" />
          Back to Map
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-[24px]">
        <div className="max-w-[600px] w-full text-center">
          
          <div className="inline-flex items-center justify-center w-[80px] h-[80px] rounded-full border border-primary/30 bg-primary/5 mb-[32px] shadow-[0_0_30px_rgba(212,175,55,0.1)]">
            <BookOpen className="w-[32px] h-[32px] text-primary/80" />
          </div>

          <span className="text-[12px] text-primary uppercase tracking-[0.3em] font-bold block mb-[16px]">
            {node.eyebrow}
          </span>
          <h1 className="font-title-serif text-[40px] text-foreground mb-[24px] uppercase tracking-wider text-glow leading-tight">
            {node.site}
          </h1>
          
          <div className="h-px w-[120px] bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mb-[32px]" />

          <p className="text-[16px] text-muted-foreground font-serif italic mb-[48px] leading-relaxed">
            {node.desc}
          </p>

          <div className="ornate-border bg-card/50 backdrop-blur-md p-[32px] rounded-xl border border-card-border inline-block">
            <span className="text-muted-foreground text-[12px] uppercase tracking-widest font-medium block">
              Chapter yahan banega
            </span>
            <span className="text-foreground font-bold mt-[8px] block text-[14px]">
              (Village World Phase)
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}
