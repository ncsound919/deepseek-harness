# @deepseek-ai/dsh-client-ui-brand-ecosystem

Ecosystem brand for the DeepSeek Harness Web client: dark-blue surfaces, white labels,
and yellow accents, plus brand occupants for the sidebar and conversation hero slots.

## Palette

| Role | Token | Value |
|---|---|---|
| Surface layer 1 | `--dsw-alias-bg-layer-1` | `#0a1628` |
| Surface layer 2 | `--dsw-alias-bg-layer-2` | `#10233f` |
| Surface layer 3 | `--dsw-alias-bg-layer-3` | `#16305a` |
| Primary label | `--dsw-alias-label-primary` | `#ffffff` |
| Accent | `--ecosystem-accent` | `#ffd400` |

Overrides are declared on both `body` and `body[data-ds-dark-theme]` so the palette
wins over ui-theme's dark-mode overrides regardless of boot mode. Only tokens verified
against upstream `ui-theme` (`design-platform.css`, `scrollbar.css`, `shiki.css`) are
overridden; extend the set after confirming additional token names locally.

## Slots

The client entry fills `sidebar.brand.mark`, `sidebar.brand.name`, and
`conversation.hero.brand.mark` through nested declaration-aware `slots.inject()` calls,
mirroring `ui-brand-official` — occupants install and withdraw as one set across HMR.
Unlike the official brand, this package is always on (no `DSH_CLIENT_BUILD_PROFILE` gate).

## Mounting

Add the plugin row to the web client composition:

```yaml
- id: ui-brand-ecosystem
  name: '@deepseek-ai/dsh-client-ui-brand-ecosystem'
```

## Build

```sh
pnpm --filter @deepseek-ai/dsh-client-ui-brand-ecosystem build
```
