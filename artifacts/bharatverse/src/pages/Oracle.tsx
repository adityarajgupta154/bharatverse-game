import { Link } from 'wouter';
import riftScene from '@/assets/images/rift-scene.jpg';
import riftSwirl from '@/assets/images/rift-swirl.png';
import { LegendBar } from '@/components/hub/LegendBar';
import { RiftInfoPanel } from '@/components/rift/RiftInfoPanel';
import { OracleGuide } from '@/components/rift/OracleGuide';
import filterCut from '@/assets/images/ui/filter-cut.png';
import riftCut from '@/assets/images/ui/rift-cut.png';

/**
 * The Time Rift — painted-scene redesign, pixel-matched to the concept
 * art (rift-scene.png is cropped straight from it at native resolution:
 * the top nav strip and bottom chrome strip are cut away because TopNav,
 * LegendBar and RightControls render those areas for real).
 *
 * Split of painted vs live, per the established pattern:
 *  - Pure visuals stay baked in the painting (title, description lines,
 *    tagline, the Wapas Naksha pill art) — pixel parity by definition;
 *    sr-only copies keep them readable for screen readers.
 *  - Anything with DATA is live DOM: the region sidebar (RiftInfoPanel
 *    covers the painted one — its numbers must not lie) and the shared
 *    chrome on the bottom band.
 *  - The portal LIVES: rift-swirl.png is the painted swirl disc cropped
 *    at native res under a feathered circular mask. It rotates slowly
 *    over its own static copy in the painting, a counter-rotating
 *    screen-blend copy adds the liquid shimmer, and a purple glow
 *    breathes behind it (all inert to pointer + reduced-motion aware).
 *  - Anything CLICKABLE gets a transparent hit-area with hover glow and
 *    a focus ring: the painted Wapas Naksha pill navigates back home.
 */
export default function Oracle() {
  return (
    <div className="absolute inset-0 bg-[#080604]">
      <img
        src={riftScene}
        alt=""
        data-testid="rift-scene"
        className="absolute left-0 top-[72px] w-[1024px] h-[453px] select-none pointer-events-none"
        draggable={false}
      />
      {/* Living portal — glow breathes behind two counter-rotating copies
          of the painted swirl (feathered mask blends them into the ring). */}
      <div
        aria-hidden
        data-testid="rift-glow"
        className="absolute left-[416px] top-[239px] w-[190px] h-[186px] rounded-full pointer-events-none opacity-60 animate-rift-glow-pulse"
        style={{
          background:
            'radial-gradient(closest-side, rgba(192,132,252,0.5), rgba(126,58,242,0.28) 55%, transparent 78%)',
          mixBlendMode: 'screen',
        }}
      />
      <img
        src={riftSwirl}
        alt=""
        data-testid="rift-swirl"
        className="absolute left-[437px] top-[259px] w-[147px] h-[145px] pointer-events-none select-none animate-rift-swirl"
        draggable={false}
      />
      <img
        src={riftSwirl}
        alt=""
        data-testid="rift-swirl-echo"
        className="absolute left-[437px] top-[259px] w-[147px] h-[145px] pointer-events-none select-none opacity-60 animate-rift-swirl-slow"
        style={{ mixBlendMode: 'screen' }}
        draggable={false}
      />

      <h1 className="sr-only">The Time Rift</h1>
      <p className="sr-only">
        Through the rift, time flows backwards. Ask the Oracle about the forgotten ages of
        Bharat, and watch the past reconstruct itself before your eyes.
      </p>

      {/* Bottom band — hosts the live chrome where the reference's strip sits */}
      <div
        aria-hidden
        className="absolute left-0 top-[525px] w-[1024px] h-[67px] bg-gradient-to-b from-[#0d0b09] to-[#050403] border-t border-primary/15"
      />

      {/* Painted "← WAPAS NAKSHA" pill → real navigation */}
      <Link
        href="/"
        aria-label="Wapas Naksha"
        data-testid="rift-back"
        className="absolute left-[373px] top-[446px] w-[264px] h-[43px] rounded-full z-40 hover:bg-primary/10 hover:shadow-[0_0_28px_rgba(212,175,55,0.28)] transition-all duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/80"
      />

      <RiftInfoPanel />
      <OracleGuide />
      <LegendBar />

      {/* Reference-parity chrome art, deliberately NOT the hub's live
          RightControls: the filter has no map gates to act on here (its
          toggles would silently persist into the hub), and the rift pill
          is the screen we're already on — so the filter renders inert and
          the glowing rift art becomes the "you are here" marker. */}
      <div aria-hidden className="absolute left-[763px] top-[534px] w-[94px] h-[36px] z-40">
        <img src={filterCut} alt="" className="w-full h-full select-none" draggable={false} />
      </div>
      <span
        role="img"
        aria-label="Time Rift — current screen"
        aria-current="page"
        data-testid="rift-current"
        className="absolute left-[856px] top-[526px] w-[156px] h-[52px] z-40"
      >
        <img src={riftCut} alt="" className="w-full h-full select-none" draggable={false} />
      </span>
    </div>
  );
}
