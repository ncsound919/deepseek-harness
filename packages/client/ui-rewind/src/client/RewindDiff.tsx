/** Divergence view for rewind_diff payloads: shared-prefix bar, first
 * divergence marker, and the differing event pairs. Pure presentational. */

import css from './RewindDiff.module.css'

interface DivergentPair {
  step: number
  a: unknown
  b: unknown
}

interface DiffPayload {
  firstDivergenceStep: number | null
  commonPrefixLength: number
  divergent: DivergentPair[]
  summary: string
}

function eventLabel(event: unknown): string {
  const record = (event ?? {}) as Record<string, unknown>
  const type = typeof record.type === 'string' ? record.type : 'event'
  const payload = (record.payload ?? {}) as Record<string, unknown>
  const name = typeof payload.name === 'string' ? payload.name : null
  return name ? `${type}: ${name}` : type
}

export function RewindDiff({ payload }: { payload: unknown }) {
  const data = (payload ?? {}) as Partial<DiffPayload>
  const divergent = Array.isArray(data.divergent) ? data.divergent : []
  const prefix = typeof data.commonPrefixLength === 'number' ? data.commonPrefixLength : 0
  const total = prefix + divergent.length
  const sharedPct = total > 0 ? Math.round((prefix / total) * 100) : 100
  return (
    <div className={css.root}>
      <div className={css.header}>Timeline diff</div>
      <div className={css.summary}>{data.summary ?? ''}</div>
      <div className={css.barTrack} role="img" aria-label={`${sharedPct}% shared prefix`}>
        <div className={css.barShared} style={{ width: `${sharedPct}%` }} />
      </div>
      <div className={css.muted}>
        {prefix} shared · {divergent.length} divergent
        {data.firstDivergenceStep != null ? ` · first divergence @ step ${data.firstDivergenceStep}` : ''}
      </div>
      <div className={css.rows}>
        {divergent.slice(0, 20).map((pair) => (
          <div key={pair.step} className={css.divergentRow}>
            <span className={css.step}>#{pair.step}</span>
            <span className={css.side}>{pair.a != null ? eventLabel(pair.a) : '—'}</span>
            <span className={css.vs}>vs</span>
            <span className={css.side}>{pair.b != null ? eventLabel(pair.b) : '—'}</span>
          </div>
        ))}
        {divergent.length > 20 ? (
          <div className={css.muted}>…and {divergent.length - 20} more</div>
        ) : null}
      </div>
    </div>
  )
}
