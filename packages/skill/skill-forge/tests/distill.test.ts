import { describe, expect, it } from 'vitest'

import { distillSkill, parseForgeEvents } from '../src/distill.js'

const TRAJECTORY = [
  JSON.stringify({ type: 'user_message', payload: { text: 'review graphene papers' } }),
  JSON.stringify({ type: 'tool_call', payload: { name: 'search_arxiv' } }),
  JSON.stringify({ type: 'tool_result', payload: { name: 'search_arxiv', output: { count: 3 } } }),
  JSON.stringify({ type: 'tool_call', payload: { name: 'lookup_physical_constant' } }),
  JSON.stringify({ type: 'tool_call', payload: { name: 'search_arxiv' } }),
].join('\n')

describe('parseForgeEvents', () => {
  it('parses JSONL into forge events', () => {
    expect(parseForgeEvents(TRAJECTORY)).toHaveLength(5)
  })

  it('throws on events without a type', () => {
    expect(() => parseForgeEvents(JSON.stringify({ payload: {} }))).toThrow(/missing type/)
  })
})

describe('distillSkill', () => {
  it('distills a trajectory into a candidate SKILL.md', () => {
    const distilled = distillSkill(parseForgeEvents(TRAJECTORY), {
      name: 'graphene-review',
      description: 'Use when reviewing graphene literature',
    })
    expect(distilled.fileName).toBe('SKILL.md')
    expect(distilled.toolChain).toEqual(['search_arxiv', 'lookup_physical_constant'])
    expect(distilled.content).toContain('name: graphene-review')
    expect(distilled.content).toContain('## Verified Tool Chain')
    expect(distilled.content).toContain('forge_record_outcome')
  })

  it('rejects non kebab-case names', () => {
    expect(() =>
      distillSkill(parseForgeEvents(TRAJECTORY), { name: 'Graphene Review', description: 'x' }),
    ).toThrow(/kebab-case/)
  })

  it('refuses to distill trajectories with no tool calls', () => {
    const empty = JSON.stringify({ type: 'user_message', payload: { text: 'hi' } })
    expect(() => distillSkill(parseForgeEvents(empty), { name: 'nope', description: 'x' })).toThrow(
      /no tool calls/,
    )
  })
})
