/**
 * Rewind details-view plugin, node half. The empty apply gives Loader a
 * host-side row while the browser half ships through `exports["./client"]`.
 */

/** Cordis plugin name. */
export const name = 'ui-rewind'

/** Host plugin body — this package contributes browser presentation only. */
export function apply(): void {}
