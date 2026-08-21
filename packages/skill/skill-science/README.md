# @deepseek-harness/skill-science

Scientific-capabilities skill plugin scaffold for **DeepSeek Harness (dsh)**.

This package implements the concrete building blocks from the "10 tips to add scientific
capabilities to DeepSeek Harness" plan as plain, dependency-free TypeScript modules that can
be wrapped by dsh's Cordis plugin system (tools, skills, sandboxes).

## What's included

| Tip | Capability | File |
|---|---|---|
| 1. Domain tool plugins | Unit conversion (length, mass, energy, pressure, temperature) | `src/tools/units.ts` |
| 1./4. Reference data tool | CODATA physical constants lookup | `src/tools/constants.ts` |
| 2./5. Domain data-source tool | arXiv literature search (Atom API, no scraping) | `src/tools/literature-search.ts` |
| 3./6. Verifiable compute primitives | Mean, stddev, linear regression | `src/tools/stats.ts` |
| Registry | Flat `scienceTools` array ready for tool-plugin wiring | `src/index.ts` |

## Not yet included (left as follow-ups, see tips 3, 7-10)

- **Sandboxed simulation execution** (tip 3): wire a Python/NumPy/SciPy sandbox through
  `packages/sandbox` or `packages/e2b` and point `code_runtime`/Code-mode calls at it.
- **Skill packaging** (tip 4): register `scienceTools` as a dsh "skill" once you confirm the
  skill-registration contract used by your build (see `packages/skill/skill-filesystem` for
  the pattern used by the built-in filesystem skill).
- **MCP bridging** (tip 5): connect MCP servers for PubMed/PDB/materials databases instead of
  (or in addition to) the arXiv-only search here.
- **Sub-agents** (tip 6): create a dedicated "verification" sub-agent that re-runs
  `stats_linear_regression` / unit conversions to sanity-check the primary agent's claims.
- **Model routing** (tip 7): configure a reasoning-heavy model (e.g. an R1-style profile) for
  hypothesis generation and a faster model for routine data wrangling.
- **Session-log audit** (tip 8): no code changes needed — dsh already logs every tool call;
  document how to replay a science session for reproducibility in `docs/`.
- **Creator-mode prototyping** (tip 9): use Creator mode to test this plugin in-memory before
  adding it to a shipped preset.
- **Reasoning-trace stripping for eval** (tip 10): if you benchmark this plugin, strip
  reasoning-trace blocks before scoring, matching the fix used in
  EleutherAI's lm-evaluation-harness for DeepSeek-R1-style models.

## Usage sketch

```ts
import { scienceTools } from "@deepseek-harness/skill-science";

for (const tool of scienceTools) {
  // Replace with the actual dsh tool-registration call for your build, e.g.:
  // registerTool({ name: tool.name, description: tool.description, handler: tool.run });
  console.log(tool.name, "->", tool.description);
}
```

## Build

```sh
pnpm --filter @deepseek-harness/skill-science build
```
