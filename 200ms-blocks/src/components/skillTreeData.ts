export type Category =
  | 'gate'
  | 'measurement'
  | 'execution'
  | 'opnode'
  | 'protocol'
  | 'security'
  | 'flashblocks'
  | 'distribution'
  | 'ha'
  | 'integration'
  | 'release';

export interface SkillNode {
  id: string;
  step: number;
  title: string;
  category: Category;
  what: string;
  output: string;
  deps: string[];
  col: number;
  row: number;
  critical?: boolean;
}

export const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  gate:         { label: 'Gate / Decision',          color: '#fbbf24' },
  measurement:  { label: 'Measurement',              color: '#facc15' },
  execution:    { label: 'Execution Layer',          color: '#6c8fff' },
  opnode:       { label: 'Validator / Consensus',    color: '#34d399' },
  protocol:     { label: 'Protocol / Economics',     color: '#a78bfa' },
  security:     { label: 'Proof / Security',         color: '#fb923c' },
  flashblocks:  { label: 'Flashblocks Migration',    color: '#f472b6' },
  distribution: { label: 'Distribution / P2P',       color: '#c084fc' },
  ha:           { label: 'HA / Failover',            color: '#06b6d4' },
  integration:  { label: 'Integration / Validation', color: '#2dd4bf' },
  release:      { label: 'Release Decision',         color: '#f87171' },
};

export const NODES: SkillNode[] = [
  {
    id: '1', step: 1, title: 'Freeze Shipping Contract', category: 'gate',
    what: 'Define exactly what shipping native 200ms means: block-building SLOs, recovery / failover SLOs, validator and proof-serving lag bounds, empty-block policy, supported follower topology, and required mainnet proof posture.',
    output: 'Written shipping contract that locks every gate downstream.',
    deps: [],
    col: 0, row: 0, critical: true,
  },
  {
    id: '2', step: 2, title: 'Baseline Timing Measurement', category: 'measurement',
    what: 'Instrument end-to-end at 200ms across empty / normal / trading-burst / deposit-heavy / recovery / same-gas-per-second profiles. Identify dominators in the sequencer hot path.',
    output: 'Baseline timing artifact across all named load profiles.',
    deps: [],
    col: 0, row: 3, critical: true,
  },
  {
    id: '3', step: 3, title: 'Decide Timestamp Semantics', category: 'gate',
    what: 'Final decision on same-second blocks plus the compatibility blast radius across contracts, tooling, bridges, RPC, and downstream consumers. Default bias: NO ms timestamps.',
    output: 'Timestamp ADR + compatibility matrix.',
    deps: ['1'],
    col: 1, row: 0, critical: true,
  },
  {
    id: '4', step: 4, title: 'Lock Proof / Output-Root Pre-Gate', category: 'security',
    what: 'Initial verdict on output-root cadence, dispute posture, and proof generation requirements for native 200ms — early enough to avoid burning a quarter on perf work that the proof model later vetoes.',
    output: 'Proof / output-root pre-gate verdict + red-flag criteria.',
    deps: ['1'],
    col: 1, row: 2,
  },
  {
    id: '5', step: 5, title: 'Prove Non-QMDB State-Root MVP', category: 'execution',
    what: 'Default question: can existing MPT (with pipelining / deferred / multiproof) hit 200ms? Escalate to QMDB only if measured evidence forces it.',
    output: 'Explicit APPROVE / REJECT verdict for non-QMDB MVP.',
    deps: ['2'],
    col: 1, row: 3, critical: true,
  },
  {
    id: '6', step: 6, title: 'Optimize Block-Building Pipeline', category: 'execution',
    what: 'Make the sequencer hot path consistently fit inside 200ms under named load profiles — execution, state root, DB commit, assembly, sealing, gossip — while keeping recovery invariants intact.',
    output: 'Block-building pipeline meeting the 200ms SLO.',
    deps: ['2', '5'],
    col: 2, row: 3, critical: true,
  },
  {
    id: '7', step: 7, title: 'Compress Engine API Fixed Cost', category: 'execution',
    what: 'Drive per-block fixed overhead low enough to support 5 Hz cadence. Explore single Base binary, fast path for sequencer-produced blocks, and batching/streaming between op-node and EL.',
    output: 'Reduced per-block latency and call count.',
    deps: ['2'],
    col: 1, row: 4, critical: true,
  },
  {
    id: '8', step: 8, title: 'Prove Validator / Base-Consensus Throughput', category: 'opnode',
    what: 'Prove the validator and base-consensus path stays inside lag and catch-up SLOs at 200ms — not just steady-state, but recovery from backlog and restart.',
    output: 'Validator throughput report: steady-state, catch-up, recovery.',
    deps: ['2', '7'],
    col: 2, row: 4, critical: true,
  },
  {
    id: '9', step: 9, title: 'Prove Historical Proof-Serving Viability', category: 'security',
    what: 'Prove the reth historical proof-serving path can live with 200ms blocks. With reth as the only client, there is no alternate-client escape hatch — same-gas-per-second benchmarks plus catch-up after backlog or downtime are required.',
    output: 'Historical proof-serving viability report.',
    deps: ['2'],
    col: 1, row: 5, critical: true,
  },
  {
    id: '10', step: 10, title: 'Choose P2P / Follower Topology', category: 'distribution',
    what: 'Choose the supported follower topology and prove follower lag stays within shipping SLOs. If plain gossip is insufficient, the launch topology must be explicit.',
    output: 'Topology decision + follower-lag measurements.',
    deps: ['1', '2'],
    col: 1, row: 6,
  },
  {
    id: '11', step: 11, title: 'Recalibrate Gas / Basefee / Deposits', category: 'protocol',
    what: 'Initial 200ms gas target, basefee elasticity that avoids pathological volatility, deposit smoothing so one heavy block does not destroy cadence.',
    output: 'Frozen initial 200ms policy + simulation evidence.',
    deps: ['2'],
    col: 1, row: 7,
  },
  {
    id: '12', step: 12, title: 'Flashblocks Migration Path', category: 'flashblocks',
    what: 'Inventory all Flashblocks consumers. Migration / shim story for critical consumers. Deprecation plan for Base-specific APIs so native 200ms removes a Base-only burden instead of adding a new one.',
    output: 'Consumer inventory, migration path, and deprecation plan.',
    deps: [],
    col: 0, row: 8,
  },
  {
    id: '13', step: 13, title: 'Integrated 200ms Devnet', category: 'integration',
    what: 'Combine the chosen pieces — timestamp, state root, sequencer pipeline, Engine API, validator path, historical proof serving, P2P, gas, HA — into one running environment exercising the real shipping path.',
    output: 'Documented integrated 200ms devnet runbook.',
    deps: ['3', '4', '5', '6', '7', '8', '9', '10', '11', '14'],
    col: 3, row: 4, critical: true,
  },
  {
    id: '14', step: 14, title: 'Validate HA / Failover', category: 'ha',
    what: 'Prove the sequencer HA path and op-conductor support 200ms without turning failover into empty-block theater. Covers leader transfer time, raft latency, payload-size sensitivity, and sustained stability under load. Treated as a feasibility gate — runs against the Phase 1 perf prototypes before integrated devnet so HA risk surfaces early.',
    output: 'HA / failover SLO validation + risk characterization.',
    deps: ['1', '6', '8', '10'],
    col: 2, row: 7,
  },
  {
    id: '15', step: 15, title: 'Adversarial Soak + Recovery', category: 'integration',
    what: 'Soak across burst, deposit-heavy, lag, restart, replay, distribution slowdown, and failover scenarios. Establish that recovery actually meets the shipping contract.',
    output: 'Soak report with explicit failures and mitigations.',
    deps: ['13'],
    col: 4, row: 4, critical: true,
  },
  {
    id: '16', step: 16, title: 'Public Testnet Validation', category: 'integration',
    what: 'Validate the full path with infra operators, trading partners, and compatibility consumers. Triage every blocker by severity, owner, and migration readiness.',
    output: 'Public testnet validation report.',
    deps: ['12', '14', '15'],
    col: 5, row: 4, critical: true,
  },
  {
    id: '17', step: 17, title: 'Mainnet Recommendation', category: 'release',
    what: 'Final call: direct mainnet 200ms or do not ship yet. Anything slower than 200ms is a UX regression versus Flashblocks today, so it is not an acceptable default outcome.',
    output: 'Final go / no-go memo with rollback posture.',
    deps: ['16'],
    col: 6, row: 4, critical: true,
  },
];

export const CRITICAL_PATH: string[] = [
  '1', '2', '3', '5', '6', '7', '8', '9', '13', '15', '16', '17',
];
