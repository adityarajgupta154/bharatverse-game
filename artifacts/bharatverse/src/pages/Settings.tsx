import { Link } from 'wouter';
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react';

export default function Settings() {
  return (
    <div className="absolute top-[72px] bottom-0 left-0 right-0 bg-background flex flex-col items-center justify-center relative overflow-hidden hub-gradient">
      <div className="flex-1 flex flex-col items-center justify-center relative z-10 p-[20px]">
        <div className="ornate-border bg-card/80 backdrop-blur-md p-[30px] rounded-xl flex flex-col items-center max-w-[400px] text-center shadow-2xl">
          <SettingsIcon className="w-[48px] h-[48px] text-primary/50 mb-[16px]" />
          <h1 className="font-title-serif text-[24px] text-foreground mb-[12px] uppercase tracking-widest text-glow">Settings</h1>
          <p className="text-muted-foreground font-serif italic text-[12px] mb-[24px]">
            Audio, graphics, and account controls.
          </p>
          <Link href="/" className="px-[16px] py-[8px] rounded-full bg-primary/10 border border-primary text-primary text-[10px] font-bold uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all duration-300 flex items-center gap-[6px]">
            <ArrowLeft className="w-[12px] h-[12px]" />
            Return to Map
          </Link>
        </div>
      </div>
    </div>
  );
}
