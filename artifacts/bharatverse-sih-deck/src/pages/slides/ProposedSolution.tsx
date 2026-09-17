import villageArtwork from '@assets/reference-village.png';
import sihGuide from '@assets/image_1788458551138.png';

export default function ProposedSolution() {
  return (
    <div className="paper-grid relative h-screen w-screen overflow-hidden bg-[#f4f8fb]">
      <div className="absolute inset-x-0 top-0 h-[1.35vh] bg-[#0b70b9]" />
      <div className="absolute bottom-0 left-0 right-0 h-[1.05vh] bg-[#0b70b9]" />
      <div className="absolute left-[5vw] top-[5.4vh] w-[57vw]">
        <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.2em] text-[#0b70b9]">
          BHARATVERSE
        </p>
        <h1 className="hand-underline mt-[1.2vh] max-w-[56vw] font-display text-[3.65vw] leading-[1.04] tracking-[-0.03em] text-[#142332]">
          Proposed Solution (Describe your Idea/Solution/Prototype)
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
      <div className="absolute left-[5vw] top-[24vh] w-[45vw]">
        <div className="rounded-[1.35vw] border-[0.14vw] border-[#b8d0e3] bg-[#eaf4fb] p-[1.8vw] shadow-[0.35vw_0.45vw_0_rgba(11,112,185,0.08)]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#0b70b9]">
            BharatVerse
          </p>
          <p className="mt-[1.4vh] font-body text-[1.8vw] font-500 leading-[1.2] text-[#142332]">
            BharatVerse turns India's heritage into an interactive exploration game where children discover lost memories by walking through historically inspired worlds, solving heritage mini-games, and restoring knowledge through play.
          </p>
        </div>
        <div className="mt-[1.6vh] grid grid-cols-4 gap-[0.9vw]">
          <div className="rounded-[1.1vw] border-[0.14vw] border-[#b8d0e3] bg-[#f8fbfd] p-[1vw]">
            <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.05em] text-[#0b70b9]">
              Memory Map
            </p>
            <p className="mt-[1vh] font-body text-[1.55vw] font-500 leading-[1.18] text-[#142332]">
              Explore regions and unlock stories.
            </p>
          </div>
          <div className="rounded-[1.1vw] border-[0.14vw] border-[#b8d0e3] bg-[#f8fbfd] p-[1vw]">
            <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.05em] text-[#0b70b9]">
              Walkable Worlds
            </p>
            <p className="mt-[1vh] font-body text-[1.55vw] font-500 leading-[1.18] text-[#142332]">
              Meet NPCs and heritage buildings.
            </p>
          </div>
          <div className="rounded-[1.1vw] border-[0.14vw] border-[#b8d0e3] bg-[#f8fbfd] p-[1vw]">
            <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.05em] text-[#0b70b9]">
              Learn by Doing
            </p>
            <p className="mt-[1vh] font-body text-[1.55vw] font-500 leading-[1.18] text-[#142332]">
              Solve mini-games inspired by culture.
            </p>
          </div>
          <div className="rounded-[1.1vw] border-[0.14vw] border-[#b8d0e3] bg-[#f8fbfd] p-[1vw]">
            <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.05em] text-[#0b70b9]">
              Smriti Didi
            </p>
            <p className="mt-[1vh] font-body text-[1.55vw] font-500 leading-[1.18] text-[#142332]">
              Hindi/Hinglish help and narration.
            </p>
          </div>
        </div>
      </div>
      <div className="absolute right-[5vw] top-[24vh] h-[59vh] w-[40vw] overflow-hidden rounded-[1.7vw] border-[0.2vw] border-[#142332] bg-[#142332] shadow-[0.75vw_0.8vw_0_rgba(20,35,50,0.15)]">
        <img
          src={villageArtwork}
          crossOrigin="anonymous"
          alt="BharatVerse walkable heritage village"
          className="h-full w-full object-cover object-[50%_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#07131f]/75 via-transparent to-transparent" />
        <div className="absolute bottom-[2.4vh] left-[2vw] right-[2vw] rounded-[1vw] border-[0.12vw] border-[#f4f8fb]/45 bg-[#142332]/85 px-[1.45vw] py-[1.3vh]">
          <p className="font-body text-[1.5vw] font-800 uppercase tracking-[0.11em] text-[#f4f8fb]">
            Restore the lost memories
          </p>
          <p className="mt-[0.65vh] font-body text-[1.7vw] font-500 leading-[1.2] text-[#d8ecf7]">
            Progress that remembers the learning journey.
          </p>
        </div>
      </div>
      <div className="absolute bottom-[6.2vh] left-[5vw] flex items-center gap-[1.1vw] rounded-full border-[0.14vw] border-[#e44640] px-[1.4vw] py-[0.8vh]">
        <span className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#e44640]">
          Discover
        </span>
        <span className="font-body text-[1.7vw] font-800 text-[#e44640]">→</span>
        <span className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#e44640]">
          Play
        </span>
        <span className="font-body text-[1.7vw] font-800 text-[#e44640]">→</span>
        <span className="font-body text-[1.5vw] font-800 uppercase tracking-[0.08em] text-[#e44640]">
          Restore
        </span>
      </div>
    </div>
  );
}