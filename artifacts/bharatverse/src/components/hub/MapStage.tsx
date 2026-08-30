import { useState } from 'react';
import { useGame } from '@/game/store';
import { cn } from '@/lib/utils';
import hubReference from '@/assets/images/hub-reference.png';
import { getWorld } from '@/game/worlds';
import { RiftVeil, useRiftNavigate, consumeRiftFlag } from '@/components/world/RiftTransition';

export function MapStage() {
  const { state, selectNode } = useGame();
  const { leavingFrom, go } = useRiftNavigate();
  // Returning from a village through the rift → open with its reveal.
  const [reveal] = useState(() => consumeRiftFlag('/'));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-auto">
      {/* The reference art IS the screen: map, gates, rings, paths, Aru,
          compass — everything baked. Live UI overlays sit exactly on top
          of their baked counterparts. */}
      <img
        src={hubReference}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full select-none"
        style={{ objectFit: 'fill' }}
      />

      {/* Interactive gate hotspots, geometry from node config (stage px).
          Gates whose status is filtered out get a dim veil and stop being
          clickable; with all filters on (default) the screen is untouched. */}
      {state.nodes.map(node => {
        const h = node.hotspot;
        const visible = state.activeFilters.includes(node.status);
        const selected = state.selectedNodeId === node.id;
        const restored = node.restorationPercent >= 100;
        return (
          <div
            key={node.id}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: h.cx, top: h.cy, width: h.w, height: h.h }}
          >
            <div
              aria-hidden
              className={cn(
                'absolute inset-[-14px] rounded-[100%] transition-opacity duration-500 pointer-events-none',
                visible ? 'opacity-0' : 'opacity-100'
              )}
              style={{ background: 'radial-gradient(ellipse at center, rgba(5,4,3,0.82) 40%, transparent 72%)' }}
            />
            {/* Restored region: a soft golden aura on the gate (PRD 6.3 —
                the hub art is already full-color, so "grey→color" reads as
                this glow + the info panel's 100%). */}
            {visible && restored && (
              <span
                aria-hidden
                className="absolute inset-[-12px] rounded-[100%] pointer-events-none animate-restored-pulse"
                style={{ background: 'radial-gradient(ellipse at center, rgba(255,216,112,0.32), transparent 66%)' }}
              />
            )}
            <button
              aria-label={`${node.label} — ${node.subtitle}${node.status === 'locked' ? ' (locked)' : ''}${restored ? ' (restored)' : ''}`}
              aria-pressed={selected}
              disabled={!visible}
              tabIndex={visible ? 0 : -1}
              onClick={() => {
                selectNode(node.id);
                // Gates whose inner world exists lead straight into it (PRD 6.1)
                // through a rift-opening transition centered on this gate.
                if (node.status !== 'locked' && getWorld(node.id)) {
                  go(`/world/${node.id}`, { x: h.cx, y: h.cy });
                }
              }}
              className="absolute inset-0 rounded-[100%] cursor-pointer disabled:cursor-default group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
            >
              {visible && (
                <span
                  className="absolute inset-0 rounded-[100%] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'radial-gradient(ellipse at center, rgba(255,216,112,0.28), transparent 65%)' }}
                />
              )}
            </button>
          </div>
        );
      })}

      {reveal && <RiftVeil mode="in" />}
      {leavingFrom && <RiftVeil mode="out" origin={leavingFrom} />}
    </div>
  );
}
