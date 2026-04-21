# 200ms Blocks Site

Astro + React site that renders the first-principles plan for native 200ms blocks on Base, with an interactive Path-of-Exile-style dependency tree.

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output → dist/
npm run preview  # serve dist/
```

## Pages

| Route   | Source                                 |
|---------|----------------------------------------|
| `/`     | `src/pages/index.astro` — landing      |
| `/plan` | `src/pages/plan.astro` — renders `src/content/plan.md` and splices the SkillTree React island over the dependency-graph section |

## Skill tree

`src/components/SkillTree.tsx` + `src/components/skillTreeData.ts`.

- 15 nodes, dependencies parsed from the plan's mermaid graph
- Click an unlockable node to light it up; cascades into newly-reachable children
- "Auto-trace critical path" plays the longest chain (Steps 2 → 4 → 5 → 6 → 7 → 12 → 13 → 14 → 15)
- "Highlight critical path" toggles a static orange overlay on the longest chain
- Hover any node for the detail panel on the right

## Updating the plan

The source markdown lives at `src/content/plan.md`. It was copied from
`workspace/projects/work/2026/200ms-blocks/plans/first-principles-200ms-block-time-plan.md`.
If the upstream plan changes, copy it over and (if the dependency graph changed) update
`src/components/skillTreeData.ts` to match.

## Adding more sites

Each future site gets its own top-level folder in this repo, e.g. `another-project/`, with
the same layout pattern (Astro + React, plan markdown in `src/content/`, custom widgets in
`src/components/`).
