# @deepseek-ai/dsh-client-ui-rewind

Visual timeline, fork, and divergence views for **dsh rewind** tool output in the
DeepSeek Harness Web client details panel.

## What it does

Registers one occupant on the verified `conversation.details.tool` single slot
(`kind: 'single', scope: 'session'`). When the rendered tool block belongs to a
`rewind_*` tool, the occupant upgrades the output:

| Tool | View |
|---|---|
| `rewind_load_session` / `rewind_load_trajectory` | Timeline-loaded card |
| `rewind_fork` | Counterfactual-branch card with fork-step badge |
| `rewind_list_timelines` | Timeline tree, forks indented under their parents |
| `rewind_diff` | Divergence view: shared-prefix bar, first-divergence marker, differing pairs |
| `rewind_inspect_step` | Event card |

Every non-rewind block renders through a plain `<pre>` fallback that mirrors the
shell default, so other tools keep working.

## Caveat: single-slot shadowing

`conversation.details.tool` is a single slot — this occupant shadows the shipped
default renderer for all tool blocks (the slot catalog flags this `replaceRisk:
shadows-shipped-ui`). The pass-through fallback keeps rendering functional, but if
the upstream default gains features, this package must re-mirror them. Mount it only
in compositions where rewind views are wanted.

## Theming

All styles are CSS modules reading `--dsw-alias-*` tokens plus the
`--ecosystem-accent` custom property, so the view follows whatever brand plugin is
active — with `@deepseek-ai/dsh-client-ui-brand-ecosystem` it renders navy surfaces,
white labels, and yellow fork markers automatically.

## Mounting

```yaml
- id: ui-rewind
  name: '@deepseek-ai/dsh-client-ui-rewind'
```

## Build

```sh
pnpm --filter @deepseek-ai/dsh-client-ui-rewind build
```
