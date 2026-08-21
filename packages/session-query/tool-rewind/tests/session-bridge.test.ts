import { describe, expect, it } from 'vitest'

import { extractEvents, mapEventType, normalizeSessionEvents } from '../src/session-bridge.js'

describe('mapEventType', () => {
  it('maps tool call variants', () => {
    expect(mapEventType('tool_call')).toBe('tool_call')
    expect(mapEventType('ToolInvoke')).toBe('tool_call')
    expect(mapEventType('tool.request')).toBe('tool_call')
  })

  it('maps tool result variants', () => {
    expect(mapEventType('tool_result')).toBe('tool_result')
    expect(mapEventType('tool.output')).toBe('tool_result')
  })

  it('maps reasoning, user, model, and context variants', () => {
    expect(mapEventType('reasoning')).toBe('reasoning_trace')
    expect(mapEventType('user_message')).toBe('user_message')
    expect(mapEventType('assistant_message')).toBe('model_message')
    expect(mapEventType('context_injection')).toBe('context_injection')
  })

  it('falls back to context_injection for unknown types', () => {
    expect(mapEventType('mystery')).toBe('context_injection')
    expect(mapEventType(undefined)).toBe('context_injection')
  })
})

describe('normalizeSessionEvents', () => {
  it('normalizes records with type/payload/step fields', () => {
    const events = normalizeSessionEvents([
      { step: 0, type: 'user_message', timestamp: '2026-08-21T00:00:00Z', payload: { text: 'hi' } },
      { step: 1, type: 'tool_call', payload: { name: 'convert_unit' } },
    ])
    expect(events).toHaveLength(2)
    expect(events[0].type).toBe('user_message')
    expect(events[1].type).toBe('tool_call')
    expect(events[1].payload.rawType).toBe('tool_call')
  })

  it('accepts kind/data/seq field variants', () => {
    const events = normalizeSessionEvents([
      { kind: 'tool_call', data: { name: 'search_arxiv' }, seq: 5 },
    ])
    expect(events[0].step).toBe(5)
    expect(events[0].type).toBe('tool_call')
    expect(events[0].payload.name).toBe('search_arxiv')
  })

  it('assigns the array index when no step field exists', () => {
    const events = normalizeSessionEvents([
      { type: 'user_message', payload: {} },
      { type: 'model_message', payload: {} },
    ])
    expect(events.map((e) => e.step)).toEqual([0, 1])
  })
})

describe('extractEvents', () => {
  it('reads the events field', () => {
    expect(extractEvents({ events: [{ type: 'user_message' }] })).toHaveLength(1)
  })

  it('accepts log and entries fallbacks', () => {
    expect(extractEvents({ log: [{}] })).toHaveLength(1)
    expect(extractEvents({ entries: [{}, {}] })).toHaveLength(2)
  })

  it('throws a descriptive error when no events array exists', () => {
    expect(() => extractEvents({ id: 'abc' })).toThrow(/events array/)
  })
})
