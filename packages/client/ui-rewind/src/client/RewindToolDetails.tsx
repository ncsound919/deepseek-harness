/** Occupant for the `conversation.details.tool` single slot: renders rewind
 * tool output as themed timeline/diff views and mirrors the shell's plain
 * pre-styled fallback for every other tool so registering here never breaks
 * the default renderer. */

import { parseRewindBlock, stringifyBlock } from './rewind-blocks.js'
import { RewindDiff } from './RewindDiff.tsx'
import { RewindTimeline } from './RewindTimeline.tsx'
import css from './RewindTimeline.module.css'

export interface RewindToolDetailsProps {
  block?: unknown
}

export function RewindToolDetails({ block }: RewindToolDetailsProps) {
  const info = parseRewindBlock(block)
  if (!info) {
    return <pre className={css.fallback}>{stringifyBlock(block)}</pre>
  }
  if (info.tool === 'rewind_diff') {
    return <RewindDiff payload={info.payload} />
  }
  return <RewindTimeline payload={info.payload} />
}
