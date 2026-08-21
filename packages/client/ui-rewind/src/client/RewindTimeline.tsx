/** Timeline tree / fork-card views for rewind_load_*, rewind_fork, and
 * rewind_list_timelines payloads. Pure presentational; themed through the
 * --dsw-alias tokens so the active brand (e.g. ui-brand-ecosystem) applies. */

import css from './RewindTimeline.module.css'

interface TimelineSummary {
  id: string
  parentId?: string | null
  forkStep?: number | null
  eventCount: number
  createdAt?: string
}

function depthOf(timeline: TimelineSummary, all: TimelineSummary[]): number {
  let depth = 0
  let current = timeline
  const byId = new Map(all.map((t) => [t.id, t]))
  while (current.parentId) {
    const parent = byId.get(current.parentId)
    if (!parent || depth > all.length) break
    depth += 1
    current = parent
  }
  return depth
}

function TimelineRow({ timeline, all }: { timeline: TimelineSummary; all: TimelineSummary[] }) {
  const isFork = timeline.parentId != null
  const depth = depthOf(timeline, all)
  return (
    <div className={css.row} style={{ paddingLeft: `${depth * 20}px` }}>
      <span className={isFork ? css.forkDot : css.rootDot} aria-hidden="true" />
      <span className={css.id}>{timeline.id}</span>
      {isFork ? <span className={css.forkBadge}>fork @ step {timeline.forkStep}</span> : null}
      <span className={css.muted}>{timeline.eventCount} events</span>
    </div>
  )
}

function SingleResult({ data }: { data: Record<string, unknown> }) {
  const forked = data.parentId != null
  return (
    <div className={css.card}>
      <div className={css.cardTitle}>
        {forked ? 'Counterfactual branch created' : 'Timeline loaded'}
      </div>
      <div className={css.cardBody}>
        <span className={css.id}>{String(data.timelineId ?? 'unknown')}</span>
        {forked ? <span className={css.forkBadge}>fork @ step {String(data.forkStep)}</span> : null}
        {typeof data.eventCount === 'number' ? (
          <span className={css.muted}>{data.eventCount} events</span>
        ) : null}
        {typeof data.carriedEvents === 'number' ? (
          <span className={css.muted}>{data.carriedEvents} carried</span>
        ) : null}
        {typeof data.sourceSession === 'string' ? (
          <span className={css.muted}>session {data.sourceSession}</span>
        ) : null}
      </div>
    </div>
  )
}

export function RewindTimeline({ payload }: { payload: unknown }) {
  const data = (payload ?? {}) as Record<string, unknown>
  const timelines = Array.isArray(data.timelines) ? (data.timelines as TimelineSummary[]) : null
  return (
    <div className={css.root}>
      <div className={css.header}>Rewind</div>
      {timelines ? (
        <div className={css.tree}>
          {timelines.map((t) => (
            <TimelineRow key={t.id} timeline={t} all={timelines} />
          ))}
        </div>
      ) : (
        <SingleResult data={data} />
      )}
    </div>
  )
}
