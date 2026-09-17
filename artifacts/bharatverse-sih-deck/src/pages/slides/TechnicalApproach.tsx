import sihGuide from '@assets/image_1788458551138.png';

export default function TechnicalApproach() {
  return (
    <div className="paper-grid relative h-screen w-screen overflow-hidden bg-[#f4f8fb]">
      <div className="absolute inset-x-0 top-0 h-[1.35vh] bg-[#0b70b9]" />
      <div className="absolute bottom-0 left-0 right-0 h-[1.05vh] bg-[#0b70b9]" />
      <div className="absolute left-[5vw] top-[5.4vh]">
        <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.2em] text-[#0b70b9]">
          BHARATVERSE
        </p>
        <h1 className="hand-underline mt-[1.2vh] font-display text-[4.35vw] leading-none tracking-[-0.03em] text-[#142332]">
          TECHNICAL APPROACH
        </h1>
      </div>
      <div className="absolute right-[5vw] top-[2.7vh] h-[4.5vw] w-[9.2vw] overflow-hidden rounded-[0.4vw] bg-[#f4f8fb]">
        <img
          src={sihGuide}
          crossOrigin="anonymous"
          alt=""
          className="absolute right-[-0.4vw] top-[-0.2vw] h-[31vw] w-[55vw] max-w-none object-cover object-[100%_0]"
        />
      </div>
      <div className="absolute left-[5vw] top-[20vh] grid w-[90vw] grid-cols-2 grid-rows-[24vh_24vh_18vh] gap-x-[2.1vw] gap-y-[1.8vh]">
        <div className="overflow-hidden rounded-[1.25vw] border-[0.14vw] border-[#b8d0e3] bg-[#eaf4fb] p-[1.5vw] shadow-[0.32vw_0.42vw_0_rgba(11,112,185,0.08)]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#0b70b9]">
            Technologies
          </p>
          <p className="mt-[1.5vh] font-body text-[2vw] font-500 leading-[1.22] text-[#142332]">
            Technologies: React, TypeScript, Vite, Tailwind CSS, Node.js/Express API, Sarvam AI, localStorage, Playwright
          </p>
        </div>
        <div className="overflow-hidden rounded-[1.25vw] border-[0.14vw] border-[#b8d0e3] bg-[#eaf4fb] p-[1.5vw] shadow-[0.32vw_0.42vw_0_rgba(11,112,185,0.08)]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#0b70b9]">
            Methodology
          </p>
          <p className="mt-[1.5vh] font-body text-[2vw] font-500 leading-[1.22] text-[#142332]">
            Methodology: Discover → Explore → Play → Restore → Reflect
          </p>
          <div className="mt-[2.3vh] flex items-center gap-[0.65vw] text-[1.5vw] font-800 text-[#e44640]">
            <span>Discover</span>
            <span>→</span>
            <span>Explore</span>
            <span>→</span>
            <span>Play</span>
            <span>→</span>
            <span>Reflect</span>
          </div>
        </div>
        <div className="overflow-hidden rounded-[1.25vw] border-[0.14vw] border-[#b8d0e3] bg-[#f8fbfd] p-[1.5vw] shadow-[0.32vw_0.42vw_0_rgba(20,35,50,0.07)]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#0b70b9]">
            Working prototype
          </p>
          <p className="mt-[1.5vh] font-body text-[2vw] font-500 leading-[1.22] text-[#142332]">
            Working prototype: Memory Map, walkable Sindhu Ghati village, heritage mini-games, Oracle Guide, Hindi/Hinglish narration
          </p>
        </div>
        <div className="overflow-hidden rounded-[1.25vw] border-[0.14vw] border-[#b8d0e3] bg-[#f8fbfd] p-[1.5vw] shadow-[0.32vw_0.42vw_0_rgba(20,35,50,0.07)]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#0b70b9]">
            Data approach
          </p>
          <p className="mt-[1.5vh] font-body text-[2vw] font-500 leading-[1.22] text-[#142332]">
            Data approach: Structured heritage world data with validated regions, buildings, NPCs, discoveries, and unlock rules
          </p>
        </div>
        <div className="col-span-2 overflow-hidden rounded-[1.25vw] border-[0.14vw] border-[#142332] bg-[#142332] p-[1.5vw] shadow-[0.42vw_0.5vw_0_rgba(228,70,64,0.25)]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#75c4ef]">
            Quality approach
          </p>
          <p className="mt-[1.2vh] max-w-[82vw] font-body text-[1.75vw] font-500 leading-[1.18] text-[#f4f8fb]">
            Quality approach: Type-safe APIs, solvability checks, keyboard accessibility, responsive UI, and automated visual/game tests
          </p>
        </div>
      </div>
    </div>
  );
}