import React, { createContext, useContext, useState, useEffect } from 'react';
import { GAME_NODES, GameNode, INITIAL_PLAYER, PlayerState, NodeStatus } from './nodes';

interface GameState {
  player: PlayerState;
  nodes: GameNode[];
  selectedNodeId: string;
  activeFilters: NodeStatus[];
  /**
   * World-layer progress deltas: nodeId → ids of buildings the player has
   * completed there. Only ids are stored — building content always comes
   * fresh from the world configs.
   */
  completedBuildings: Record<string, string[]>;
}

const STORAGE_KEY = 'bharatverse-state';
// v3 adds completedBuildings (world-layer progress deltas). v2 saves load
// fine — the new field just starts empty.
const SCHEMA_VERSION = 3;

const INITIAL_STATE: GameState = {
  player: INITIAL_PLAYER,
  nodes: GAME_NODES,
  selectedNodeId: 'sindhu-ghati',
  activeFilters: ['explored', 'in_progress', 'locked'],
  completedBuildings: {},
};

/** Only progress fields are persisted — node content (copy, coords, rewards)
 *  always comes fresh from GAME_NODES config so config updates never fight
 *  stale saves. */
interface PersistedNodeProgress {
  id: string;
  status: NodeStatus;
  restorationPercent: number;
  memoriesFound: number;
}

interface PersistedState {
  v: number;
  player: PlayerState;
  selectedNodeId: string;
  activeFilters: NodeStatus[];
  nodes: PersistedNodeProgress[];
  completedBuildings: Record<string, string[]>;
}

const VALID_STATUSES: NodeStatus[] = ['explored', 'in_progress', 'locked'];

function isValidStatus(s: unknown): s is NodeStatus {
  return typeof s === 'string' && (VALID_STATUSES as string[]).includes(s);
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
}

/** Persisted data is untyped user-editable localStorage — validate every
 *  field and fall back to config defaults rather than trusting the shape. */
function loadInitialState(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return INITIAL_STATE;
    const parsed = JSON.parse(saved) as Partial<PersistedState>;
    // v2 → v3 is additive (completedBuildings starts empty), so v2 saves are
    // still accepted; anything else is discarded.
    if (parsed.v !== 2 && parsed.v !== SCHEMA_VERSION) return INITIAL_STATE;

    const rawNodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
    const progressById = new Map<string, Partial<PersistedNodeProgress>>(
      rawNodes
        .filter((p): p is PersistedNodeProgress => !!p && typeof p === 'object' && typeof (p as { id?: unknown }).id === 'string')
        .map(p => [p.id, p])
    );
    const nodes = GAME_NODES.map(cfg => {
      const p = progressById.get(cfg.id);
      if (!p) return cfg;
      return {
        ...cfg,
        status: isValidStatus(p.status) ? p.status : cfg.status,
        restorationPercent: clampNumber(p.restorationPercent, cfg.restorationPercent, 0, 100),
        memoriesFound: clampNumber(p.memoriesFound, cfg.memoriesFound, 0, cfg.memoriesTotal),
      };
    });

    const selectedNodeId = nodes.some(n => n.id === parsed.selectedNodeId)
      ? (parsed.selectedNodeId as string)
      : INITIAL_STATE.selectedNodeId;

    const rawPlayer = (parsed.player && typeof parsed.player === 'object' ? parsed.player : {}) as Partial<PlayerState>;
    const maxXp = clampNumber(rawPlayer.maxXp, INITIAL_PLAYER.maxXp, 1, 1_000_000);
    const player: PlayerState = {
      name: typeof rawPlayer.name === 'string' && rawPlayer.name.trim() ? rawPlayer.name : INITIAL_PLAYER.name,
      level: clampNumber(rawPlayer.level, INITIAL_PLAYER.level, 1, 999),
      xp: clampNumber(rawPlayer.xp, INITIAL_PLAYER.xp, 0, maxXp),
      maxXp,
    };

    const filters = Array.isArray(parsed.activeFilters)
      ? parsed.activeFilters.filter(isValidStatus)
      : [];

    // Building ids are validated for shape only (string arrays, deduped);
    // membership is resolved against world configs at read time, so stale ids
    // from removed buildings are simply ignored.
    const completedBuildings: Record<string, string[]> = {};
    const rawCompleted =
      parsed.completedBuildings && typeof parsed.completedBuildings === 'object' && !Array.isArray(parsed.completedBuildings)
        ? parsed.completedBuildings
        : {};
    for (const [worldId, ids] of Object.entries(rawCompleted)) {
      if (!Array.isArray(ids)) continue;
      const clean = [...new Set(ids.filter((x): x is string => typeof x === 'string'))];
      if (clean.length > 0) completedBuildings[worldId] = clean;
    }

    return {
      player,
      nodes,
      selectedNodeId,
      activeFilters: filters.length > 0 ? filters : INITIAL_STATE.activeFilters,
      completedBuildings,
    };
  } catch (e) {
    console.warn('Could not read saved game state, starting fresh', e);
    return INITIAL_STATE;
  }
}

function persist(state: GameState) {
  const data: PersistedState = {
    v: SCHEMA_VERSION,
    player: state.player,
    selectedNodeId: state.selectedNodeId,
    activeFilters: state.activeFilters,
    nodes: state.nodes.map(n => ({
      id: n.id,
      status: n.status,
      restorationPercent: n.restorationPercent,
      memoriesFound: n.memoriesFound,
    })),
    completedBuildings: state.completedBuildings,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

interface GameContextType {
  state: GameState;
  selectNode: (id: string) => void;
  updateNodeStatus: (id: string, updates: Partial<GameNode>) => void;
  toggleFilter: (status: NodeStatus) => void;
  /** Idempotent: records a world-layer building as completed by the player. */
  markBuildingComplete: (nodeId: string, buildingId: string) => void;
  /**
   * Region-restore event (PRD 6.3): fired when a node's climax building is
   * completed. Marks the map node fully restored — the Hub renders its
   * restored treatment and the info panel shows 100%.
   */
  restoreNode: (nodeId: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(loadInitialState);

  useEffect(() => {
    try {
      persist(state);
    } catch (e) {
      console.warn('Could not save game state', e);
    }
  }, [state]);

  const selectNode = (id: string) => {
    setState(s => ({ ...s, selectedNodeId: id }));
  };

  const updateNodeStatus = (id: string, updates: Partial<GameNode>) => {
    setState(s => ({
      ...s,
      nodes: s.nodes.map(n => (n.id === id ? { ...n, ...updates } : n))
    }));
  };

  const markBuildingComplete = (nodeId: string, buildingId: string) => {
    setState(s => {
      const existing = s.completedBuildings[nodeId] ?? [];
      if (existing.includes(buildingId)) return s;
      return {
        ...s,
        completedBuildings: {
          ...s.completedBuildings,
          [nodeId]: [...existing, buildingId],
        },
      };
    });
  };

  const restoreNode = (id: string) => {
    setState(s => ({
      ...s,
      nodes: s.nodes.map(n =>
        n.id === id
          ? { ...n, status: 'explored' as NodeStatus, restorationPercent: 100, memoriesFound: n.memoriesTotal }
          : n
      ),
    }));
  };

  const toggleFilter = (status: NodeStatus) => {
    setState(s => {
      const isCurrentlyActive = s.activeFilters.includes(status);
      const newFilters = isCurrentlyActive
        ? s.activeFilters.filter(f => f !== status)
        : [...s.activeFilters, status];

      // Don't allow unchecking everything
      if (newFilters.length === 0) return s;

      return { ...s, activeFilters: newFilters };
    });
  };

  return (
    <GameContext.Provider value={{ state, selectNode, updateNodeStatus, toggleFilter, markBuildingComplete, restoreNode }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
