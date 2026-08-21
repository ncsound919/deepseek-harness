import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

import { diffTimelines } from './diff.js'
import { JsonTimelineStorage, PersistentTimelineStore } from './persistence.js'
import { extractEvents, normalizeSessionEvents, type SessionQueryLike } from './session-bridge.js'
import { parseTrajectoryJsonl, TimelineStore } from './trajectory.js'

export * from './trajectory.js'
export * from './diff.js'
export * from './persistence.js'
export * from './session-bridge.js'

export const name = 'tool-rewind'
export const inject = ['tools']

export interface RewindConfig {
  /** Directory where timelines persist as JSON documents. Omit for in-memory only. */
  persistenceDir?: string
}

const JSON_TEXT_OUTPUT = {
  schema: { type: 'object' as const, additionalProperties: true },
  render: (_args: unknown, value: unknown) => [
    { type: 'text' as const, text: JSON.stringify(value, null, 2) },
  ],
}

export function apply(ctx: Context, config?: RewindConfig): void {
  const store = config?.persistenceDir
    ? new PersistentTimelineStore(new JsonTimelineStorage(config.persistenceDir))
    : new TimelineStore()
  if (store instanceof PersistentTimelineStore) {
    void store.hydrate()
  }

  ctx.tools.register(
    defineTool({
      name: 'rewind_load_session',
      description:
        'Load a live or persisted dsh session directly from the sessionQuery service into a root timeline, with no manual JSONL export. Find session ids with the session_search tool first.',
      parameters: {
        sessionId: { type: 'string', required: true, description: 'Exact session id to load as a timeline' },
        timelineId: { type: 'string', required: false, description: 'Optional explicit id for the root timeline' },
      },
      output: JSON_TEXT_OUTPUT,
      async execute({ sessionId, timelineId }) {
        // Defensive lookup instead of a hard inject so the plugin still
        // activates in compositions without a SessionQueryEngine backend.
        const sessionQuery = (ctx as unknown as { sessionQuery?: SessionQueryLike }).sessionQuery
        if (!sessionQuery) {
          throw new Error(
            'rewind_load_session requires the sessionQuery service; mount a SessionQueryEngine backend (e.g. session-query-sqlite) in this composition',
          )
        }
        const records = await sessionQuery.filterSessions([{ kind: 'id', values: [sessionId] }])
        const session = Array.isArray(records) ? records[0] : records
        if (!session) {
          throw new Error(`Session not found or not authorized: ${sessionId}`)
        }
        const events = normalizeSessionEvents(extractEvents(session))
        const timeline = store.load(events, timelineId)
        return { timelineId: timeline.id, eventCount: timeline.events.length, sourceSession: sessionId }
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'rewind_load_trajectory',
      description:
        'Load an append-only dsh session log (JSONL, one trajectory event per line) as a root timeline for time-travel debugging.',
      parameters: {
        jsonl: { type: 'string', required: true, description: 'The session trajectory in JSONL format' },
        timelineId: { type: 'string', required: false, description: 'Optional explicit id for the root timeline' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ jsonl, timelineId }) {
        const events = parseTrajectoryJsonl(jsonl)
        const timeline = store.load(events, timelineId)
        return Promise.resolve({ timelineId: timeline.id, eventCount: timeline.events.length })
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'rewind_list_timelines',
      description: 'List all loaded timelines with their parent, fork step, and event counts.',
      parameters: {},
      output: JSON_TEXT_OUTPUT,
      execute() {
        return Promise.resolve({ timelines: store.list() })
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'rewind_fork',
      description:
        'Fork a timeline at a specific step to create a counterfactual branch. Optionally override the model or patch the prompt on the forked branch.',
      parameters: {
        sourceTimelineId: { type: 'string', required: true, description: 'Timeline to fork from' },
        atStep: { type: 'number', required: true, description: 'Step index at which the branch diverges' },
        model: { type: 'string', required: false, description: 'Model to use on the forked branch' },
        promptPatch: { type: 'string', required: false, description: 'Text appended to the system prompt on the forked branch' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ sourceTimelineId, atStep, model, promptPatch }) {
        const timeline = store.fork(sourceTimelineId, atStep, { model, promptPatch })
        return Promise.resolve({
          timelineId: timeline.id,
          parentId: timeline.parentId,
          forkStep: timeline.forkStep,
          carriedEvents: timeline.events.length,
        })
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'rewind_diff',
      description:
        'Diff two timelines event-by-event: reports the shared prefix length, the first divergence step, and every differing event.',
      parameters: {
        timelineA: { type: 'string', required: true, description: 'First timeline id' },
        timelineB: { type: 'string', required: true, description: 'Second timeline id' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ timelineA, timelineB }) {
        return Promise.resolve(diffTimelines(store.get(timelineA), store.get(timelineB)))
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'rewind_inspect_step',
      description: 'Return the full trajectory event at a given step of a timeline.',
      parameters: {
        timelineId: { type: 'string', required: true, description: 'Timeline id' },
        step: { type: 'number', required: true, description: 'Step index to inspect' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ timelineId, step }) {
        const timeline = store.get(timelineId)
        const event = timeline.events.find((entry) => entry.step === step)
        if (!event) {
          throw new Error(`Timeline ${timelineId} has no step ${step}`)
        }
        return Promise.resolve(event)
      },
    }),
  )
}
