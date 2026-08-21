/**
 * Bridge between dsh's event-sourced session store and rewind timelines.
 * Resolves authorized sessions through the sessionQuery service and normalizes
 * event-sourced log records into TrajectoryEvent sequences.
 *
 * Verified upstream surface (deepseek-ai/deepseek-harness):
 * - ctx.sessionQuery is a SessionQueryEngine (abstract Service, inject ['sessions'])
 * - filterSessions([{ kind: 'id', values: [id] }]) resolves sessions by id
 * - searchSessions({ query, sessionFilters, eventFilters }) runs full-text search
 * The exact record shape returned for one session is confirmed against a local
 * checkout; extractEvents below fails loudly with guidance if it does not carry
 * an events array.
 */

import type { TrajectoryEvent, TrajectoryEventType } from './trajectory.js'

/** Minimal structural view of the sessionQuery engine used by this bridge. */
export interface SessionQueryLike {
  filterSessions(filters: Array<{ kind: string; values: string[] }>): Promise<unknown[]>
  searchSessions(request: Record<string, unknown>): Promise<unknown>
}

const TYPE_MAP: Array<[RegExp, TrajectoryEventType]> = [
  [/tool.*(call|invoke|request)/i, 'tool_call'],
  [/tool.*(result|output|response)/i, 'tool_result'],
  [/(reason|think|cot)/i, 'reasoning_trace'],
  [/context/i, 'context_injection'],
  [/user/i, 'user_message'],
  [/(model|assistant)/i, 'model_message'],
]

/** Map a raw session-log event type string onto the rewind event vocabulary. */
export function mapEventType(raw: unknown): TrajectoryEventType {
  const text = String(raw ?? '')
  for (const [pattern, type] of TYPE_MAP) {
    if (pattern.test(text)) return type
  }
  return 'context_injection'
}

/** Normalize event-sourced session records into an ordered trajectory. */
export function normalizeSessionEvents(records: unknown[]): TrajectoryEvent[] {
  return records.map((record, index) => {
    const entry = (record ?? {}) as Record<string, unknown>
    const rawType = entry.type ?? entry.kind ?? entry.event ?? 'unknown'
    const payload = (entry.payload ?? entry.data ?? entry) as Record<string, unknown>
    const stepValue = entry.step ?? entry.seq ?? entry.index ?? index
    return {
      step: typeof stepValue === 'number' ? stepValue : index,
      type: mapEventType(rawType),
      timestamp: typeof entry.timestamp === 'string' ? entry.timestamp : new Date(0).toISOString(),
      payload: { ...payload, rawType: String(rawType) },
    }
  })
}

/** Extract the event array from a session record returned by sessionQuery. */
export function extractEvents(session: unknown): unknown[] {
  const record = (session ?? {}) as Record<string, unknown>
  const events = record.events ?? record.log ?? record.entries
  if (!Array.isArray(events)) {
    throw new Error(
      'Session record does not carry an events array (checked: events, log, entries). ' +
        'Confirm the SessionQueryEngine read shape against your local checkout and extend extractEvents.',
    )
  }
  return events
}
