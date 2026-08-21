/**
 * Ecosystem theme tokens: dark-blue surfaces, white labels, yellow accents.
 * Declared on both `body` and `body[data-ds-dark-theme]` so the palette wins
 * over the dark overrides in ui-theme's design-platform.css regardless of
 * which mode the shell boots into (the attribute selector is more specific,
 * so matching it is what makes the override stick in dark mode).
 *
 * Only tokens verified against upstream ui-theme are overridden:
 * --dsw-alias-bg-layer-{1,2,3}, --dsw-alias-label-{primary,secondary,tertiary},
 * --dsw-alias-scrollbar-{bg,hover}-l{1,2}, and --dsw-alias-markdown-code-block.
 */
export const ECOSYSTEM_STYLES = `
body,
body[data-ds-dark-theme] {
  --dsw-alias-bg-layer-1: #0a1628;
  --dsw-alias-bg-layer-2: #10233f;
  --dsw-alias-bg-layer-3: #16305a;
  --dsw-alias-label-primary: #ffffff;
  --dsw-alias-label-secondary: rgba(255, 255, 255, 0.72);
  --dsw-alias-label-tertiary: rgba(255, 255, 255, 0.52);
  --dsw-alias-scrollbar-bg-l1: #16305a;
  --dsw-alias-scrollbar-bg-l2: #1f3d6e;
  --dsw-alias-scrollbar-hover-l1: #ffd400;
  --dsw-alias-scrollbar-hover-l2: #ffd400;
  --dsw-alias-markdown-code-block: #0d1b30;
  --ecosystem-accent: #ffd400;
}
`

/** Inject the stylesheet as a plugin-owned global style; returns cleanup. */
export function installStylesheet(css: string): () => void {
  const element = document.createElement('style')
  element.setAttribute('data-dsh-brand', 'ecosystem')
  element.textContent = css
  document.head.appendChild(element)
  return () => {
    element.remove()
  }
}
