import { describe, expect, it } from 'vitest'

import { diffTimelines } from '../src/diff.js'
import { parseTrajectoryJsonl, TimelineStore } from '../src/trajectory.js'

const BASE_JSONL = [
  JSON.stringify({ step: 0, type: 'user_message', timestamp: '2026-08-21T00:00:00Z', payload: { text: 'run the analysis' } }),
  JSON.stringify({ step: 1, type: 'tool_call', timestamp: '2026-08-21T00:00:01Z', payload: { name: 'stats_summary', args: { values: [1, 2, 3] } } }),
  JSON.stringify({ step: 2, type: 'tool_result', timestamp: '2026-08-21T00:00:02Z', payload: { name: 'stats_summary', output: { mean: 2 } } }),
  JSON.stringify({ step: 3, type: 'model_message', timestamp: '2026-08-21T00:00:03Z', payload: { text: 'mean is 2' } }),
].join('\n')

describe('diffTimelines', () => {
  it('reports identical timelines as having no divergence', () => {
    const store = new TimelineStore()
    const root = store.load(parseTrajectoryJsonl(BASE_JSONL))
    const diff = diffTimelines(root, root)
    expect(diff.firstDivergenceStep).toBeNull()
    expect(diff.commonPrefixLength).toBe(4)
    expect(diff.divergent).toHaveLength(0)
  })

  it('finds the first divergence after a fork with an override', () => {
    const store = new TimelineStore()
    const root = store.load(parseTrajectoryJsonl(BASE_JSONL))
    const fork = store.fork(root.id, 2, { toolOutputOverrides: { 2: { mean: 0 } } })
    const diff = diffTimelines(root, fork)
    expect(diff.commonPrefixLength).toBe(2)
    expect(diff.firstDivergenceStep).toBe(2)
    expect(diff.summary).toContain('diverge at step 2')
  })

  it('handles timelines of different lengths', () => {
    const store = new TimelineStore()
    const root = store.load(parseTrajectoryJsonl(BASE_JSONL))
    const fork = store.fork(root.id, 1, {})
    const diff = diffTimelines(root, fork)
    expect(diff.divergent.length).toBeGreaterThan(0)
    expect(diff.divergent.at(-1)?.b).toBeNull()
  })
})
