import { describe, expect, it } from 'vitest'

import {
  blockOutput,
  blockToolName,
  isRewindBlock,
  parseRewindBlock,
  stringifyBlock,
} from '../src/client/rewind-blocks.js'

describe('blockToolName', () => {
  it('reads name, toolName, and tool fields', () => {
    expect(blockToolName({ name: 'rewind_fork' })).toBe('rewind_fork')
    expect(blockToolName({ toolName: 'rewind_diff' })).toBe('rewind_diff')
    expect(blockToolName({ tool: 'rewind_list_timelines' })).toBe('rewind_list_timelines')
  })

  it('returns null when no name field exists', () => {
    expect(blockToolName({})).toBeNull()
    expect(blockToolName(null)).toBeNull()
  })
})

describe('isRewindBlock', () => {
  it('detects rewind-prefixed tools only', () => {
    expect(isRewindBlock({ name: 'rewind_fork' })).toBe(true)
    expect(isRewindBlock({ name: 'write' })).toBe(false)
  })
})

describe('blockOutput', () => {
  it('parses JSON string output', () => {
    expect(blockOutput({ name: 'rewind_diff', output: '{"commonPrefixLength":2}' })).toEqual({
      commonPrefixLength: 2,
    })
  })

  it('passes structured output through untouched', () => {
    const output = { timelineId: 'root-1', eventCount: 4 }
    expect(blockOutput({ name: 'rewind_load_trajectory', output })).toEqual(output)
  })

  it('returns non-JSON strings as-is', () => {
    expect(blockOutput({ name: 'rewind_fork', output: 'plain text' })).toBe('plain text')
  })
})

describe('parseRewindBlock', () => {
  it('returns tool and payload for rewind blocks', () => {
    const info = parseRewindBlock({ name: 'rewind_diff', output: '{"summary":"s"}' })
    expect(info?.tool).toBe('rewind_diff')
    expect(info?.payload).toEqual({ summary: 's' })
  })

  it('returns null for non-rewind blocks', () => {
    expect(parseRewindBlock({ name: 'read', output: '{}' })).toBeNull()
  })
})

describe('stringifyBlock', () => {
  it('pretty-prints structured output', () => {
    expect(stringifyBlock({ name: 'write', output: { ok: true } })).toContain('"ok": true')
  })

  it('passes string output through', () => {
    expect(stringifyBlock({ name: 'write', output: 'done' })).toBe('done')
  })
})
