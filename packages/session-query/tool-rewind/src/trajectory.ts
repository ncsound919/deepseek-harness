/**
 * Trajectory model for dsh rewind: time-travel debugging over the append-only
 * session log. The log is modeled as JSONL, one typed TrajectoryEvent per line,
 * and a TimelineStore that can load logs, fork them at any step, and track
 * multiple counterfactual branches side by side.
 */

export type TrajectoryEventType =
  | 'user_message'
  | 'model_message'
  | 'reasoning_trace'
  | 'tool_call'
  | 'tool_result'
  | 'context_injection'

export interface TrajectoryEvent {
  step: number
  type: TrajectoryEventType
  timestamp: string
  payload: Record<string, unknown>
}

export interface ForkOverrides {
  model?: string
  promptPatch?: string
  toolOutputOverrides?: Record<number, unknown>
}

export interface Timeline {
  id: string
  parentId: string | null
  forkStep: number | null
  overrides: ForkOverrides
  events: TrajectoryEvent[]
  createdAt: string
}

const EVENT_TYPES = new Set<TrajectoryEventType>([
  'user_message',
  'model_message',
  'reasoning_trace',
  'tool_call',
  'tool_result',
  'context_injection',
])

export function parseTrajectoryJsonl(jsonl: string): TrajectoryEvent[] {
  const events: TrajectoryEvent[] = []
  const lines = jsonl.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const raw = JSON.parse(line) as Partial<TrajectoryEvent>
    if (typeof raw.step !== 'number' || !EVENT_TYPES.has(raw.type as TrajectoryEventType)) {
      throw new Error(`Invalid trajectory event on line ${i + 1}: missing step or unknown type`)
    }
    events.push({
      step: raw.step,
      type: raw.type as TrajectoryEventType,
      timestamp: raw.timestamp ?? new Date(0).toISOString(),
      payload: (raw.payload ?? {}) as Record<string, unknown>,
    })
  }
  events.sort((a, b) => a.step - b.step)
  return events
}

export class TimelineStore {
  private readonly timelines = new Map<string, Timeline>()
  private counter = 0

  load(events: TrajectoryEvent[], id?: string): Timeline {
    const timeline: Timeline = {
      id: id ?? this.nextId('root'),
      parentId: null,
      forkStep: null,
      overrides: {},
      events: [...events],
      createdAt: new Date().toISOString(),
    }
    this.timelines.set(timeline.id, timeline)
    return timeline
  }

  fork(sourceId: string, atStep: number, overrides: ForkOverrides): Timeline {
    const source = this.get(sourceId)
    const index = source.events.findIndex((event) => event.step === atStep)
    if (index === -1) {
      throw new Error(`Timeline ${sourceId} has no step ${atStep}`)
    }
    const events = source.events
      .slice(0, index)
      .map((event) => ({ ...event, payload: { ...event.payload } }))
    const forked = source.events[index]
    if (overrides.toolOutputOverrides && forked.type === 'tool_result') {
      const replacement = overrides.toolOutputOverrides[atStep]
      if (replacement !== undefined) {
        events.push({ ...forked, payload: { ...forked.payload, output: replacement, overridden: true } })
      }
    }
    const timeline: Timeline = {
      id: this.nextId('fork'),
      parentId: source.id,
      forkStep: atStep,
      overrides,
      events,
      createdAt: new Date().toISOString(),
    }
    this.timelines.set(timeline.id, timeline)
    return timeline
  }

  get(id: string): Timeline {
    const timeline = this.timelines.get(id)
    if (!timeline) {
      throw new Error(`Unknown timeline: ${id}`)
    }
    return timeline
  }

  list(): Array<{ id: string; parentId: string | null; forkStep: number | null; eventCount: number; createdAt: string }> {
    return [...this.timelines.values()].map((t) => ({
      id: t.id,
      parentId: t.parentId,
      forkStep: t.forkStep,
      eventCount: t.events.length,
      createdAt: t.createdAt,
    }))
  }

  private nextId(prefix: string): string {
    this.counter += 1
    return `${prefix}-${this.counter}`
  }
}
