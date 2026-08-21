/** Ecosystem occupants for the generic browser-brand slots, plus the
 * dark-blue/yellow/white token overrides injected as a plugin-owned global
 * stylesheet. Unlike ui-brand-official this package is always on: it is the
 * deployment's brand, not a build-profile variant. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import { EcosystemBrandMark, EcosystemBrandName } from './Brand.tsx'
import { ECOSYSTEM_STYLES, installStylesheet } from './styles.js'

/** Required service: the UI slot registry. */
export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  const disposeStyles = installStylesheet(ECOSYSTEM_STYLES)
  ctx.on('dispose', disposeStyles)

  // Declaration-aware nested registration, mirroring ui-brand-official: the
  // occupants install as one set whether this plugin activates before or after
  // the sidebar/conversation declarers, and withdraw together on HMR.
  ctx.slots.inject('sidebar.brand.mark', () =>
    ctx.slots.inject('sidebar.brand.name', () =>
      ctx.slots.inject('conversation.hero.brand.mark', function* () {
        yield ctx.slots.register({ name: 'sidebar.brand.mark' }, EcosystemBrandMark)
        yield ctx.slots.register({ name: 'sidebar.brand.name' }, EcosystemBrandName)
        yield ctx.slots.register({ name: 'conversation.hero.brand.mark' }, EcosystemBrandMark)
      })))
}
