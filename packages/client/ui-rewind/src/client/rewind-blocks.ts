/**
 * Detection and parsing helpers for rewind tool blocks in the details panel.
 * The details slot owner passes the tool block as `{ block, cwd }`; the block's
 * exact field names vary by renderer, so reads here are defensive and pinned
 * by tests.
 */

export interface RewindBlockInfo {
  tool: string
  payload: unknown
}

const REWIND_PREFIX = 'rewind_'

/** Best-effort read of the tool name off a details block. */
export function blockToolName(block: unknown): string | null {
  const record = (block ?? {}) as Record<string, unknown>
  const name = record.name ?? record.toolName ?? record.tool
  return typeof name === 'string' ? name : null
}

export function isRewindBlock(block: unknown): boolean {
  const name = blockToolName(block)
  return name !== null && name.startsWith(REWIND_PREFIX)
}

/** Best-effort read of the tool's structured output off a details block. */
export function blockOutput(block: unknown): unknown {
  const record = (block ?? {}) as Record<string, unknown>
  const output = record.output ?? record.structuredContent ?? record.content ?? record.result
  if (typeof output === 'string') {
    try {
      return JSON.parse(output)
    } catch {
      return output
    }
  }
  return output
}

export function parseRewindBlock(block: unknown): RewindBlockInfo | null {
  const tool = blockToolName(block)
  if (tool === null || !tool.startsWith(REWIND_PREFIX)) return null
  return { tool, payload: blockOutput(block) }
}

/** Plain-text rendering of a block for the non-rewind fallback path. */
export function stringifyBlock(block: unknown): string {
  const output = blockOutput(block)
  if (typeof output === 'string') return output
  try {
    return JSON.stringify(output ?? block, null, 2)
  } catch {
    return String(output ?? block)
  }
}
