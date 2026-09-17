import hubArtwork from '@assets/reference-hub.png';
import sihGuide from '@assets/image_1788458551138.png';

export default function BharatVerseCover() {
  return (
    <div className="paper-grid relative flex h-screen w-screen overflow-hidden bg-[#f4f8fb]">
      <div className="absolute inset-x-0 top-0 h-[1.35vh] bg-[#0b70b9]" />
      <div className="absolute bottom-0 left-0 right-0 h-[1.05vh] bg-[#0b70b9]" />
      <div className="absolute left-[5vw] top-[7vh] h-[78vh] w-[47vw] rounded-[2vw] border-[0.18vw] border-[#b8d0e3] bg-[#f8fbfd]/95 p-[3.9vw] shadow-[0.5vw_0.8vw_0_rgba(11,112,185,0.08)]">
        <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.22em] text-[#0b70b9]">
          SIH 2026
        </p>
        <h1 className="hand-underline mt-[2.9vh] w-fit font-display text-[6.4vw] leading-[0.96] tracking-[-0.04em] text-[#142332]">
          BHARATVERSE
        </h1>
        <p className="mt-[3.8vh] max-w-[35vw] font-body text-[2.15vw] font-500 leading-[1.18] text-[#385568]">
          Restoring India's Lost Memories Through Play
        </p>
        <div className="mt-[8vh] rounded-[1.3vw] border-[0.14vw] border-[#b8d0e3] bg-[#eaf4fb] px-[2vw] py-[2.1vh]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.15em] text-[#0b70b9]">
            Flow
          </p>
          <p className="mt-[1.3vh] font-body text-[1.8vw] font-700 leading-[1.3] text-[#142332]">
            React + TypeScript → Game World → Heritage Mini-Games → Sarvam AI Guide → Learning Progress
          </p>
        </div>
        <div className="absolute bottom-[3.4vh] left-[3.9vw] h-[4.5vw] w-[12vw] rotate-[-5deg] rounded-[1vw] border-[0.18vw] border-[#e44640] opacity-90" />
        <div className="absolute bottom-[2.7vh] left-[14vw] h-[0.28vw] w-[9vw] rotate-[2deg] rounded-full bg-[#e44640]" />
      </div>
      <div className="absolute right-[4.4vw] top-[7vh] h-[78vh] w-[40vw] overflow-hidden rounded-[2vw] border-[0.22vw] border-[#142332] bg-[#142332] shadow-[0.85vw_0.95vw_0_rgba(20,35,50,0.16)]">
        <img
          src={hubArtwork}
          crossOrigin="anonymous"
          alt="BharatVerse Memory Map"
          className="h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07131f]/55 via-transparent to-[#07131f]/10" />
        <div className="absolute bottom-[3.5vh] left-[2.4vw] right-[2.4vw] rounded-[1vw] border-[0.12vw] border-[#f4f8fb]/45 bg-[#142332]/80 px-[1.5vw] py-[1.3vh]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.14em] text-[#f4f8fb]">
            Restoring India's Lost Memories Through Play
          </p>
        </div>
      </div>
      <div className="absolute right-[5vw] top-[2.7vh] h-[4.5vw] w-[9.2vw] overflow-hidden rounded-[0.4vw] bg-[#f4f8fb]">
        <img
          src={sihGuide}
          crossOrigin="anonymous"
          alt=""
          className="absolute right-[-0.4vw] top-[-0.2vw] h-[31vw] w-[55vw] max-w-none object-cover object-[100%_0]"
        />
      </div>
    </div>
  );
}