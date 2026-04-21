export type Category =
  | 'gate'
  | 'measurement'
  | 'execution'
  | 'opnode'
  | 'protocol'
  | 'security'
  | 'flashblocks'
  | 'ecosystem'
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
  gate:        { label: 'Gate / Decision',        color: '#fbbf24' },
  measurement: { label: 'Measurement',            color: '#facc15' },
  execution:   { label: 'Execution Layer',        color: '#6c8fff' },
  opnode:      { label: 'Op-Node / Verifier',     color: '#34d399' },
  protocol:    { label: 'Protocol / Economics',   color: '#a78bfa' },
  security:    { label: 'Proof / Security',       color: '#fb923c' },
  flashblocks: { label: 'Flashblocks Migration',  color: '#f472b6' },
  ecosystem:   { label: 'Ecosystem / Data Plane', color: '#c084fc' },
  integration: { label: 'Integration / Validation', color: '#2dd4bf' },
  release:     { label: 'Release Decision',       color: '#f87171' },
};

export const NODES: SkillNode[] = [
  {
    id: '1', step: 1, title: 'Freeze Shipping Contract', category: 'gate',
    what: 'Define exactly what "native canonical 200ms" means: SLOs, unsafe lag envelope, security posture, non-goals, allowed rollout outcomes.',
    output: 'Shipping ADR / contract document.',
    deps: [],
    col: 0, row: 0,
  },
  {
    id: '2', step: 2, title: 'Baseline Timing Measurement', category: 'measurement',
    what: 'Instrument end-to-end: assembly, execution, state-root, DB commit, Engine API, derivation, gossip, restart/replay. Across empty / normal / trading-burst / deposit-heavy / recovery loads.',
    output: 'Baseline timing artifact identifying budget dominators.',
    deps: [],
    col: 0, row: 2, critical: true,
  },
  {
    id: '3', step: 3, title: 'Decide Timestamp Semantics', category: 'gate',
    what: 'Same-second block behavior, monotonicity rule, wall-clock & L1 relationship, compatibility envelope for TWAPs, vesting, governance, bridges, MEV. Default bias: NO ms timestamps.',
    output: 'Timestamp ADR + compatibility matrix.',
    deps: ['1'],
    col: 1, row: 0,
  },
  {
    id: '4', step: 4, title: 'Prove Non-QMDB State-Root MVP', category: 'execution',
    what: 'Default question: can we hit 200ms with pipelined / deferred / multiproof MPT first? Escalate to QMDB only if measured evidence forces it.',
    output: 'Explicit APPROVE / REJECT verdict for non-QMDB MVP.',
    deps: ['2'],
    col: 1, row: 2, critical: true,
  },
  {
    id: '5', step: 5, title: 'Break Serial Sequencer Loop', category: 'execution',
    what: 'Move from "wait 2s, then do everything" to a pipelined loop. Building block N+1 overlaps with commit/seal of N. Restart/recovery in-design.',
    output: 'Pipelined sequencer prototype with measured before/after delta.',
    deps: ['2', '4'],
    col: 2, row: 2, critical: true,
  },
  {
    id: '6', step: 6, title: 'Compress Engine API Fixed Cost', category: 'execution',
    what: 'At 5 Hz, per-block request/response overhead is real tax. Prototype fast path for sequencer-produced blocks and/or batching/streaming between op-node and EL.',
    output: 'Reduced call count and/or per-block latency.',
    deps: ['5'],
    col: 3, row: 2, critical: true,
  },
  {
    id: '7', step: 7, title: 'Prove Verifier / Derivation Throughput', category: 'opnode',
    what: 'Derivation pipeline handles 10× block boundaries. EL sync / verifier catch-up does not fall behind permanently. Restart / unsafe-head recovery acceptable.',
    output: 'Throughput report: steady-state, catch-up, recovery scenarios.',
    deps: ['2', '6'],
    col: 4, row: 2, critical: true,
  },
  {
    id: '8', step: 8, title: 'Recalibrate Gas / Basefee / Deposits', category: 'protocol',
    what: 'Initial gas target per block; basefee denominator/elasticity to avoid pathological volatility; deposit smoothing so one heavy block does not destroy cadence.',
    output: 'Parameter memo + simulation artifacts.',
    deps: ['2'],
    col: 1, row: 4,
  },
  {
    id: '9', step: 9, title: 'Prove Fault-Proof Viability', category: 'security',
    what: 'Output-root cadence; challenger/proposer load; challenged range size; runtime/cost/operability of disputes under 200ms. The security gate.',
    output: 'Proof-viability memo: mainnet approved / testnet only / reject.',
    deps: ['1'],
    col: 1, row: 6,
  },
  {
    id: '10', step: 10, title: 'Flashblocks Migration Path', category: 'flashblocks',
    what: 'Inventory all Flashblocks consumers. Migration / shim story for critical consumers. Deprecation plan for Base-specific APIs.',
    output: 'Compatibility shim and deprecation plan.',
    deps: [],
    col: 0, row: 8,
  },
  {
    id: '11', step: 11, title: 'Data Plane + Ecosystem Package', category: 'ecosystem',
    what: 'Batcher cadence, span-batch sizing, RPC/subscription behavior, EIP-2935 history window, archive/storage growth, wallet/bridge/indexer/explorer expectations.',
    output: 'Data-plane and ecosystem compatibility package.',
    deps: ['8', '9', '10'],
    col: 2, row: 6,
  },
  {
    id: '12', step: 12, title: 'Integrated 200ms Devnet', category: 'integration',
    what: 'Combine approved pieces into one environment exercising the chosen timestamp / state-root / EL / op-node / gas / proof decisions.',
    output: 'Documented integrated devnet runbook.',
    deps: ['3', '4', '5', '6', '7', '8', '9', '11'],
    col: 5, row: 4, critical: true,
  },
  {
    id: '13', step: 13, title: 'Adversarial Soak + Recovery', category: 'integration',
    what: 'Steady-state trading load, burst, deposit-heavy, follower lag, sequencer restart/replay, reorg/reset, component slowdown.',
    output: 'Soak report with explicit failures and mitigations.',
    deps: ['12'],
    col: 6, row: 4, critical: true,
  },
  {
    id: '14', step: 14, title: 'Public Testnet Validation', category: 'integration',
    what: 'Validate with infra operators, trading partners, compatibility consumers. Collect partner blockers, severity, owners, migration readiness.',
    output: 'Public-testnet validation report.',
    deps: ['10', '13'],
    col: 7, row: 4, critical: true,
  },
  {
    id: '15', step: 15, title: 'Mainnet Recommendation', category: 'release',
    what: 'Direct mainnet 200ms / Staged rollout (500ms→1s→200ms) / Do not ship yet.',
    output: 'Final go/no-go memo with rollback posture.',
    deps: ['14'],
    col: 8, row: 4, critical: true,
  },
];

export const CRITICAL_PATH: string[] = ['2', '4', '5', '6', '7', '12', '13', '14', '15'];
