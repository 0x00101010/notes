import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { NODES, CATEGORY_META, CRITICAL_PATH, type SkillNode, type Category } from './skillTreeData';
import './skillTree.css';

const COL_GAP = 150;
const ROW_GAP = 72;
const PAD_X = 90;
const PAD_Y = 70;
const NODE_R = 28;

const positionOf = (n: SkillNode) => ({
  x: n.col * COL_GAP + PAD_X,
  y: n.row * ROW_GAP + PAD_Y,
});

const NODE_BY_ID = new Map(NODES.map((n) => [n.id, n]));

const CHILDREN_OF = (() => {
  const m = new Map<string, string[]>();
  for (const n of NODES) m.set(n.id, []);
  for (const n of NODES) for (const d of n.deps) m.get(d)?.push(n.id);
  return m;
})();

const SVG_W = Math.max(...NODES.map((n) => n.col)) * COL_GAP + PAD_X * 2;
const SVG_H = Math.max(...NODES.map((n) => n.row)) * ROW_GAP + PAD_Y * 2;

interface Pulse { key: number; type: 'edge' | 'burst'; pathId?: string; nodeId?: string; color: string; }

export default function SkillTree() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<string | null>(null);
  const [showCritical, setShowCritical] = useState(false);
  const [pulses, setPulses] = useState<Pulse[]>([]);
  const pulseKey = useRef(0);
  const autoTimer = useRef<number | null>(null);

  const isUnlocked = useCallback((id: string) => unlocked.has(id), [unlocked]);

  const isUnlockable = useCallback(
    (n: SkillNode) => !unlocked.has(n.id) && n.deps.every((d) => unlocked.has(d)),
    [unlocked],
  );

  const tryUnlock = useCallback(
    (n: SkillNode) => {
      if (unlocked.has(n.id)) return;
      if (!n.deps.every((d) => unlocked.has(d))) {
        const el = document.querySelector(`[data-node="${n.id}"]`);
        el?.classList.add('shake');
        window.setTimeout(() => el?.classList.remove('shake'), 350);
        return;
      }
      setUnlocked((prev) => new Set(prev).add(n.id));
      const color = CATEGORY_META[n.category].color;
      const newPulses: Pulse[] = [
        { key: ++pulseKey.current, type: 'burst', nodeId: n.id, color },
      ];
      for (const d of n.deps) {
        newPulses.push({
          key: ++pulseKey.current,
          type: 'edge',
          pathId: `edge-${d}-${n.id}`,
          color,
        });
      }
      setPulses((prev) => [...prev, ...newPulses]);
      window.setTimeout(() => {
        setPulses((prev) => prev.filter((p) => !newPulses.find((np) => np.key === p.key)));
      }, 900);
    },
    [unlocked],
  );

  const reset = () => {
    setUnlocked(new Set());
    setPulses([]);
    if (autoTimer.current) {
      window.clearInterval(autoTimer.current);
      autoTimer.current = null;
    }
  };

  const playCriticalPath = () => {
    reset();
    let i = 0;
    const tick = () => {
      if (i >= CRITICAL_PATH.length) {
        if (autoTimer.current) window.clearInterval(autoTimer.current);
        autoTimer.current = null;
        return;
      }
      const id = CRITICAL_PATH[i++];
      const node = NODE_BY_ID.get(id);
      if (node) {
        setUnlocked((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });
        const color = CATEGORY_META[node.category].color;
        const newPulses: Pulse[] = [
          { key: ++pulseKey.current, type: 'burst', nodeId: id, color },
        ];
        for (const d of node.deps) {
          newPulses.push({
            key: ++pulseKey.current,
            type: 'edge',
            pathId: `edge-${d}-${id}`,
            color,
          });
        }
        setPulses((prev) => [...prev, ...newPulses]);
        window.setTimeout(() => {
          setPulses((prev) => prev.filter((p) => !newPulses.find((np) => np.key === p.key)));
        }, 900);
      }
    };
    tick();
    autoTimer.current = window.setInterval(tick, 700) as unknown as number;
  };

  useEffect(() => () => {
    if (autoTimer.current) window.clearInterval(autoTimer.current);
  }, []);

  const edges = useMemo(() => {
    const list: { from: SkillNode; to: SkillNode }[] = [];
    for (const to of NODES) {
      for (const d of to.deps) {
        const from = NODE_BY_ID.get(d);
        if (from) list.push({ from, to });
      }
    }
    return list;
  }, []);

  const hoveredNode = hover ? NODE_BY_ID.get(hover) : null;
  const hoveredAncestors = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const set = new Set<string>();
    const visit = (id: string) => {
      const n = NODE_BY_ID.get(id);
      if (!n) return;
      for (const d of n.deps) {
        if (set.has(d)) continue;
        set.add(d);
        visit(d);
      }
    };
    visit(hoveredNode.id);
    return set;
  }, [hoveredNode]);

  const hoveredDescendants = useMemo(() => {
    if (!hoveredNode) return new Set<string>();
    const set = new Set<string>();
    const visit = (id: string) => {
      for (const c of CHILDREN_OF.get(id) || []) {
        if (set.has(c)) continue;
        set.add(c);
        visit(c);
      }
    };
    visit(hoveredNode.id);
    return set;
  }, [hoveredNode]);

  const edgePath = (a: SkillNode, b: SkillNode) => {
    const p1 = positionOf(a);
    const p2 = positionOf(b);
    const dx = p2.x - p1.x;
    const cx1 = p1.x + dx * 0.55;
    const cy1 = p1.y;
    const cx2 = p2.x - dx * 0.55;
    const cy2 = p2.y;
    return `M ${p1.x} ${p1.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p2.x} ${p2.y}`;
  };

  const edgeState = (from: SkillNode, to: SkillNode): 'live' | 'ready' | 'dim' => {
    if (isUnlocked(from.id) && isUnlocked(to.id)) return 'live';
    if (isUnlocked(from.id) && isUnlockable(to)) return 'ready';
    return 'dim';
  };

  const totalNodes = NODES.length;
  const unlockedCount = unlocked.size;
  const criticalUnlocked = CRITICAL_PATH.filter((id) => unlocked.has(id)).length;

  return (
    <div className="skill-tree">
      <div className="skill-tree-header">
        <div className="skill-tree-title">
          <span className="st-eyebrow">Interactive Plan</span>
          <h3 className="st-h3">17-Step Dependency Tree</h3>
          <p className="st-sub">
            Click a node to unlock it — its children light up when their prerequisites are met.
            The critical chain runs Steps 1 → 2 → 3 → 5 → (6, 7, 8) → 9 → 10 → 13 → 15 → 16 → 17.
          </p>
        </div>
        <div className="st-controls">
          <button onClick={playCriticalPath} className="st-btn st-btn-primary" type="button">
            <span aria-hidden>▶</span> Auto-trace critical path
          </button>
          <button
            onClick={() => setShowCritical((s) => !s)}
            className={`st-btn ${showCritical ? 'st-btn-active' : ''}`}
            type="button"
          >
            {showCritical ? '✓ ' : ''}Highlight critical path
          </button>
          <button onClick={reset} className="st-btn" type="button">
            ⟲ Reset
          </button>
        </div>
        <div className="st-stats">
          <span className="st-stat">
            <span className="st-stat-num">{unlockedCount}</span>
            <span className="st-stat-label">/ {totalNodes} unlocked</span>
          </span>
          <span className="st-stat">
            <span className="st-stat-num" style={{ color: 'var(--orange)' }}>{criticalUnlocked}</span>
            <span className="st-stat-label">/ {CRITICAL_PATH.length} critical-path</span>
          </span>
        </div>
      </div>

      <div className="skill-tree-canvas-wrap">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="skill-tree-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <radialGradient id={`grad-${key}`} key={key}>
                <stop offset="0%" stopColor={meta.color} stopOpacity="1" />
                <stop offset="55%" stopColor={meta.color} stopOpacity="0.85" />
                <stop offset="100%" stopColor={meta.color} stopOpacity="0.55" />
              </radialGradient>
            ))}
            <radialGradient id="grad-locked">
              <stop offset="0%" stopColor="#2c3450" stopOpacity="1" />
              <stop offset="60%" stopColor="#1a2034" stopOpacity="1" />
              <stop offset="100%" stopColor="#0e131f" stopOpacity="1" />
            </radialGradient>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <radialGradient id={`grad-locked-${key}`} key={`l-${key}`}>
                <stop offset="0%" stopColor={meta.color} stopOpacity="0.18" />
                <stop offset="55%" stopColor="#1a2034" stopOpacity="1" />
                <stop offset="100%" stopColor="#0e131f" stopOpacity="1" />
              </radialGradient>
            ))}
            <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-strong" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="8" result="b1" />
              <feGaussianBlur stdDeviation="3" result="b2" />
              <feMerge>
                <feMergeNode in="b1" />
                <feMergeNode in="b2" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <pattern id="techgrid" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1a2236" strokeWidth="0.5" opacity="0.6" />
            </pattern>
            <pattern id="techgrid-major" x="0" y="0" width="150" height="150" patternUnits="userSpaceOnUse">
              <path d="M 150 0 L 0 0 0 150" fill="none" stroke="#243056" strokeWidth="0.7" opacity="0.7" />
            </pattern>
            <pattern id="starfield" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              <circle cx="14" cy="22" r="0.6" fill="#a3b3ff" opacity="0.45" />
              <circle cx="78" cy="14" r="0.4" fill="#fff" opacity="0.30" />
              <circle cx="48" cy="80" r="0.7" fill="#fff" opacity="0.50" />
              <circle cx="100" cy="66" r="0.35" fill="#a3b3ff" opacity="0.25" />
              <circle cx="28" cy="62" r="0.5" fill="#fff" opacity="0.30" />
              <circle cx="92" cy="98" r="0.4" fill="#a3b3ff" opacity="0.20" />
            </pattern>
            <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0e1320" stopOpacity="0" />
              <stop offset="65%" stopColor="#04060d" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#04060d" stopOpacity="0.95" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="#070912" />
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#techgrid)" />
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#techgrid-major)" />
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#starfield)" />
          <rect x="0" y="0" width={SVG_W} height={SVG_H} fill="url(#vignette)" />

          <g className="edges">
            {edges.map(({ from, to }) => {
              const state = edgeState(from, to);
              const onCritical = showCritical && from.critical && to.critical
                && CRITICAL_PATH.includes(from.id) && CRITICAL_PATH.includes(to.id);
              const isHoverPath = hover && (
                (hoveredAncestors.has(from.id) || from.id === hover) &&
                (hoveredAncestors.has(to.id) || to.id === hover) &&
                hoveredAncestors.has(from.id)
              );
              const isHoverDesc = hover && (
                from.id === hover && hoveredDescendants.has(to.id)
              ) || (
                hoveredDescendants.has(from.id) && hoveredDescendants.has(to.id)
              );
              const colorBase = state === 'live' || state === 'ready'
                ? CATEGORY_META[to.category].color
                : '#4a5680';
              return (
                <path
                  key={`${from.id}-${to.id}`}
                  id={`edge-${from.id}-${to.id}`}
                  d={edgePath(from, to)}
                  fill="none"
                  stroke={onCritical ? '#fb923c' : colorBase}
                  strokeWidth={
                    onCritical ? 3 :
                    isHoverPath || isHoverDesc ? 2.6 :
                    state === 'live' ? 2.4 :
                    state === 'ready' ? 1.8 : 1.5
                  }
                  strokeOpacity={
                    onCritical ? 1 :
                    isHoverPath || isHoverDesc ? 0.95 :
                    state === 'live' ? 0.9 :
                    state === 'ready' ? 0.6 : 0.6
                  }
                  strokeDasharray={state === 'dim' ? '5 5' : undefined}
                  filter={state === 'live' ? 'url(#glow)' : undefined}
                />
              );
            })}
          </g>

          <g className="edge-pulses">
            {pulses.filter((p) => p.type === 'edge').map((p) => (
              <circle key={p.key} r="4" fill={p.color} filter="url(#glow-strong)">
                <animateMotion dur="0.7s" repeatCount="1" fill="freeze">
                  <mpath xlinkHref={`#${p.pathId}`} />
                </animateMotion>
                <animate attributeName="opacity" from="1" to="0" dur="0.7s" fill="freeze" />
                <animate attributeName="r" from="4" to="2" dur="0.7s" fill="freeze" />
              </circle>
            ))}
          </g>

          <g className="nodes">
            {NODES.map((n) => {
              const { x, y } = positionOf(n);
              const meta = CATEGORY_META[n.category];
              const unlockedNow = isUnlocked(n.id);
              const ready = isUnlockable(n);
              const onCritical = showCritical && CRITICAL_PATH.includes(n.id);
              const dimmed = !!hover && hover !== n.id && !hoveredAncestors.has(n.id) && !hoveredDescendants.has(n.id);

              const fill = unlockedNow ? `url(#grad-${n.category})` : `url(#grad-locked-${n.category})`;
              const strokeColor = unlockedNow ? meta.color : ready ? meta.color : '#2e3448';
              const strokeWidth = onCritical ? 3 : unlockedNow ? 2.2 : ready ? 2 : 1.5;
              const opacity = dimmed ? 0.35 : 1;

              return (
                <g
                  key={n.id}
                  data-node={n.id}
                  transform={`translate(${x} ${y})`}
                  onClick={() => tryUnlock(n)}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover((h) => (h === n.id ? null : h))}
                  className={`node ${unlockedNow ? 'unlocked' : ready ? 'ready' : 'locked'}`}
                  style={{ cursor: ready || unlockedNow ? 'pointer' : 'not-allowed', opacity, transition: 'opacity 0.2s' }}
                >
                  {onCritical && (
                    <circle r={NODE_R + 8} fill="none" stroke="#fb923c" strokeWidth={1} strokeDasharray="2 4" opacity={0.55} />
                  )}
                  {unlockedNow && (
                    <circle r={NODE_R + 4} fill={meta.color} opacity={0.18} filter="url(#glow-strong)" />
                  )}
                  {ready && !unlockedNow && (
                    <circle r={NODE_R + 2} fill="none" stroke={meta.color} strokeWidth={1.4} opacity={0.5} className="ready-pulse" />
                  )}
                  <circle
                    r={NODE_R}
                    fill={fill}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    filter={unlockedNow ? 'url(#glow)' : undefined}
                  />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily="'JetBrains Mono', ui-monospace, monospace"
                    fontWeight={800}
                    fontSize="17"
                    fill={unlockedNow ? '#0a0d18' : ready ? meta.color : '#a8b1d3'}
                    pointerEvents="none"
                    style={{ textShadow: unlockedNow ? 'none' : ready ? `0 0 6px ${meta.color}` : 'none' }}
                  >
                    {n.step}
                  </text>
                </g>
              );
            })}
          </g>

          <g className="bursts">
            {pulses.filter((p) => p.type === 'burst').map((p) => {
              const node = NODE_BY_ID.get(p.nodeId!);
              if (!node) return null;
              const { x, y } = positionOf(node);
              const rays = 10;
              return (
                <g key={p.key} transform={`translate(${x} ${y})`}>
                  {Array.from({ length: rays }).map((_, i) => {
                    const angle = (i / rays) * Math.PI * 2;
                    const tx = Math.cos(angle) * 50;
                    const ty = Math.sin(angle) * 50;
                    return (
                      <circle
                        key={i}
                        r="2.4"
                        fill={p.color}
                        opacity="0.95"
                        filter="url(#glow-strong)"
                      >
                        <animate attributeName="cx" from="0" to={tx} dur="0.7s" fill="freeze" />
                        <animate attributeName="cy" from="0" to={ty} dur="0.7s" fill="freeze" />
                        <animate attributeName="opacity" from="0.95" to="0" dur="0.7s" fill="freeze" />
                        <animate attributeName="r" from="2.4" to="0.6" dur="0.7s" fill="freeze" />
                      </circle>
                    );
                  })}
                  <circle r={NODE_R + 2} fill="none" stroke={p.color} strokeWidth="3" opacity="0.7">
                    <animate attributeName="r" from={NODE_R + 2} to={NODE_R + 30} dur="0.7s" fill="freeze" />
                    <animate attributeName="opacity" from="0.7" to="0" dur="0.7s" fill="freeze" />
                    <animate attributeName="stroke-width" from="3" to="0.5" dur="0.7s" fill="freeze" />
                  </circle>
                </g>
              );
            })}
          </g>
        </svg>

        <div className="skill-tree-side">
          {hoveredNode ? <NodeDetail node={hoveredNode} unlocked={unlocked.has(hoveredNode.id)} ready={isUnlockable(hoveredNode)} /> : <Legend />}
        </div>
      </div>
    </div>
  );
}

function NodeDetail({ node, unlocked, ready }: { node: SkillNode; unlocked: boolean; ready: boolean }) {
  const meta = CATEGORY_META[node.category];
  const status = unlocked ? 'UNLOCKED' : ready ? 'READY TO UNLOCK' : 'LOCKED';
  const statusColor = unlocked ? meta.color : ready ? meta.color : '#5b6280';
  const childIds = CHILDREN_OF.get(node.id) || [];

  return (
    <div className="st-detail">
      <div className="st-detail-header">
        <span className="st-detail-step" style={{ background: meta.color, color: '#0a0d18' }}>
          Step {node.step}
        </span>
        <span className="st-detail-status" style={{ color: statusColor }}>
          {status}
        </span>
      </div>
      <h4 className="st-detail-title">{node.title}</h4>
      <div className="st-detail-cat" style={{ color: meta.color }}>
        {meta.label}
      </div>
      <p className="st-detail-what">{node.what}</p>
      <div className="st-detail-row">
        <span className="st-detail-label">Output</span>
        <span className="st-detail-value">{node.output}</span>
      </div>
      {node.deps.length > 0 && (
        <div className="st-detail-row">
          <span className="st-detail-label">Depends on</span>
          <span className="st-detail-value">{node.deps.map((d) => `Step ${NODE_BY_ID.get(d)?.step ?? d}`).join(' · ')}</span>
        </div>
      )}
      {childIds.length > 0 && (
        <div className="st-detail-row">
          <span className="st-detail-label">Unlocks</span>
          <span className="st-detail-value">{childIds.map((c) => `Step ${NODE_BY_ID.get(c)?.step ?? c}`).join(' · ')}</span>
        </div>
      )}
      {node.critical && (
        <div className="st-detail-critical">on critical path</div>
      )}
    </div>
  );
}

function Legend() {
  const cats = Object.entries(CATEGORY_META) as [Category, { label: string; color: string }][];
  return (
    <div className="st-detail">
      <div className="st-legend-eyebrow">Hover a node for details</div>
      <h4 className="st-legend-title">Categories</h4>
      <ul className="st-legend">
        {cats.map(([k, m]) => (
          <li key={k}>
            <span className="st-legend-dot" style={{ background: m.color, boxShadow: `0 0 8px ${m.color}aa` }} />
            <span>{m.label}</span>
          </li>
        ))}
      </ul>
      <div className="st-legend-eyebrow" style={{ marginTop: 18 }}>How it works</div>
      <ul className="st-legend st-legend-howto">
        <li><span className="st-legend-state st-legend-locked" /> Locked — prerequisites missing</li>
        <li><span className="st-legend-state st-legend-ready" /> Ready — click to unlock</li>
        <li><span className="st-legend-state st-legend-unlocked" /> Unlocked</li>
      </ul>
    </div>
  );
}
