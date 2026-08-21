/** Rewind details-view occupants for the web client. Mounts one
 * `conversation.details.tool` registration that upgrades rewind_* tool output
 * to themed timeline/fork/diff views and passes every other tool through to a
 * plain pre fallback. */
import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import { RewindToolDetails } from './RewindToolDetails.tsx'

/** Required service: the UI slot registry. */
export const inject = ['slots']

export function apply(ctx: ClientContext): void {
  ctx.slots.inject('conversation.details.tool', () =>
    ctx.slots.register({ name: 'conversation.details.tool' }, RewindToolDetails))
}
