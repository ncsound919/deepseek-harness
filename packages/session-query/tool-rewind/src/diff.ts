import type { Timeline, TrajectoryEvent } from './trajectory.js'

export interface DivergentPair {
  step: number
  a: TrajectoryEvent | null
  b: TrajectoryEvent | null
}

export interface TimelineDiff {
  firstDivergenceStep: number | null
  commonPrefixLength: number
  divergent: DivergentPair[]
  summary: string
}

function sameEvent(a: TrajectoryEvent, b: TrajectoryEvent): boolean {
  return a.type === b.type && JSON.stringify(a.payload) === JSON.stringify(b.payload)
}

export function diffTimelines(a: Timeline, b: Timeline): TimelineDiff {
  const limit = Math.min(a.events.length, b.events.length)
  let prefix = 0
  while (prefix < limit && sameEvent(a.events[prefix], b.events[prefix])) {
    prefix += 1
  }
  const divergent: DivergentPair[] = []
  const tail = Math.max(a.events.length, b.events.length)
  for (let i = prefix; i < tail; i++) {
    divergent.push({
      step: i,
      a: a.events[i] ?? null,
      b: b.events[i] ?? null,
    })
  }
  const firstDivergenceStep = divergent.length > 0 ? divergent[0].step : null
  const summary =
    firstDivergenceStep === null
      ? `Timelines ${a.id} and ${b.id} are identical across ${prefix} events.`
      : `Timelines ${a.id} and ${b.id} share ${prefix} events, then diverge at step ${firstDivergenceStep} with ${divergent.length} differing events.`
  return { firstDivergenceStep, commonPrefixLength: prefix, divergent, summary }
}
