import { Link } from 'wouter';
import { ArrowLeft, Orbit } from 'lucide-react';

export default function Oracle() {
  return (
    <div className="absolute top-[72px] bottom-0 left-0 right-0 bg-zinc-950 flex flex-col relative overflow-hidden items-center justify-center">
      {/* Cosmic background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-zinc-950 to-black" />
      <div className="absolute w-[800px] h-[800px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-[600px] p-[24px]">
        <Orbit className="w-[80px] h-[80px] text-purple-300 mb-[32px] animate-[spin_8s_linear_infinite]" />
        
        <h1 className="font-title-serif text-[40px] font-bold text-transparent bg-clip-text bg-gradient-to-b from-purple-100 to-purple-500 mb-[24px] uppercase tracking-[0.2em] drop-shadow-lg">
          The Time Rift
        </h1>
        
        <p className="text-[16px] text-purple-200/70 font-medium mb-[48px] leading-relaxed">
          Through the rift, time flows backwards. Ask the Oracle about the forgotten ages of Bharat, and watch the past reconstruct itself before your eyes.
        </p>

        <Link href="/" className="px-[32px] py-[16px] rounded-full bg-purple-900/30 border border-purple-500/50 text-purple-100 text-[12px] font-bold uppercase tracking-widest hover:bg-purple-600/40 hover:border-purple-300 transition-all duration-500 flex items-center gap-[12px] shadow-[0_0_20px_rgba(168,85,247,0.2)] hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]">
          <ArrowLeft className="w-[18px] h-[18px]" />
          Wapas Naksha
        </Link>
      </div>
    </div>
  );
}
