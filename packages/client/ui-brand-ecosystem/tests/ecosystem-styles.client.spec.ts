import { describe, expect, it } from 'vitest'

import { ECOSYSTEM_STYLES } from '../src/client/styles.js'

describe('ECOSYSTEM_STYLES', () => {
  it('declares overrides on body and the dark-theme selector', () => {
    expect(ECOSYSTEM_STYLES).toContain('body,')
    expect(ECOSYSTEM_STYLES).toContain('body[data-ds-dark-theme]')
  })

  it('overrides the verified design-platform alias tokens', () => {
    const tokens = [
      '--dsw-alias-bg-layer-1',
      '--dsw-alias-bg-layer-2',
      '--dsw-alias-bg-layer-3',
      '--dsw-alias-label-primary',
      '--dsw-alias-label-secondary',
      '--dsw-alias-label-tertiary',
      '--dsw-alias-scrollbar-bg-l1',
      '--dsw-alias-scrollbar-hover-l1',
      '--dsw-alias-markdown-code-block',
    ]
    for (const token of tokens) {
      expect(ECOSYSTEM_STYLES).toContain(token)
    }
  })

  it('locks the ecosystem palette', () => {
    expect(ECOSYSTEM_STYLES).toContain('#0a1628')
    expect(ECOSYSTEM_STYLES).toContain('#ffd400')
    expect(ECOSYSTEM_STYLES).toContain('#ffffff')
  })
})
