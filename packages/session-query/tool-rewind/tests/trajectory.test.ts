import { describe, expect, it } from 'vitest'

import { parseTrajectoryJsonl, TimelineStore } from '../src/trajectory.js'

const SAMPLE_JSONL = [
  JSON.stringify({ step: 0, type: 'user_message', timestamp: '2026-08-21T00:00:00Z', payload: { text: 'run the analysis' } }),
  JSON.stringify({ step: 1, type: 'tool_call', timestamp: '2026-08-21T00:00:01Z', payload: { name: 'search_arxiv', args: { query: 'graphene' } } }),
  JSON.stringify({ step: 2, type: 'tool_result', timestamp: '2026-08-21T00:00:02Z', payload: { name: 'search_arxiv', output: { count: 3 } } }),
  JSON.stringify({ step: 3, type: 'model_message', timestamp: '2026-08-21T00:00:03Z', payload: { text: 'found 3 papers' } }),
].join('\n')

describe('parseTrajectoryJsonl', () => {
  it('parses JSONL into events sorted by step', () => {
    const events = parseTrajectoryJsonl(SAMPLE_JSONL)
    expect(events).toHaveLength(4)
    expect(events.map((e) => e.step)).toEqual([0, 1, 2, 3])
    expect(events[1].type).toBe('tool_call')
  })

  it('skips blank lines', () => {
    const events = parseTrajectoryJsonl(SAMPLE_JSONL + '\n\n')
    expect(events).toHaveLength(4)
  })

  it('throws on an unknown event type', () => {
    const bad = JSON.stringify({ step: 0, type: 'teleport', payload: {} })
    expect(() => parseTrajectoryJsonl(bad)).toThrow(/unknown type/)
  })

  it('throws when step is missing', () => {
    const bad = JSON.stringify({ type: 'user_message', payload: {} })
    expect(() => parseTrajectoryJsonl(bad)).toThrow(/line 1/)
  })
})

describe('TimelineStore', () => {
  it('loads a root timeline with no parent', () => {
    const store = new TimelineStore()
    const timeline = store.load(parseTrajectoryJsonl(SAMPLE_JSONL))
    expect(timeline.parentId).toBeNull()
    expect(timeline.events).toHaveLength(4)
    expect(store.list()).toHaveLength(1)
  })

  it('forks at a step and carries only the prior events', () => {
    const store = new TimelineStore()
    const root = store.load(parseTrajectoryJsonl(SAMPLE_JSONL))
    const fork = store.fork(root.id, 2, { model: 'deepseek-r1' })
    expect(fork.parentId).toBe(root.id)
    expect(fork.forkStep).toBe(2)
    expect(fork.events.map((e) => e.step)).toEqual([0, 1])
    expect(fork.overrides.model).toBe('deepseek-r1')
  })

  it('applies a tool output override at the fork step', () => {
    const store = new TimelineStore()
    const root = store.load(parseTrajectoryJsonl(SAMPLE_JSONL))
    const fork = store.fork(root.id, 2, { toolOutputOverrides: { 2: { count: 0 } } })
    expect(fork.events).toHaveLength(3)
    const overridden = fork.events[2]
    expect(overridden.payload.output).toEqual({ count: 0 })
    expect(overridden.payload.overridden).toBe(true)
  })

  it('throws when forking at an unknown step', () => {
    const store = new TimelineStore()
    const root = store.load(parseTrajectoryJsonl(SAMPLE_JSONL))
    expect(() => store.fork(root.id, 99, {})).toThrow(/no step 99/)
  })

  it('restores persisted timelines without id collisions', () => {
    const store = new TimelineStore()
    const root = store.load(parseTrajectoryJsonl(SAMPLE_JSONL))
    const fork = store.fork(root.id, 1, {})

    const restored = new TimelineStore()
    restored.restore(root)
    restored.restore(fork)
    const fresh = restored.load(parseTrajectoryJsonl(SAMPLE_JSONL))
    expect(fresh.id).not.toBe(root.id)
    expect(fresh.id).not.toBe(fork.id)
    expect(restored.list()).toHaveLength(3)
  })
})
