import { describe, expect, it } from 'vitest'

import { TelemetryStore } from '../src/telemetry.js'

describe('TelemetryStore', () => {
  it('registers candidates without invocations', () => {
    const store = new TelemetryStore()
    const record = store.register('my-skill')
    expect(record.status).toBe('candidate')
    expect(record.invocations).toBe(0)
  })

  it('computes success rate from recorded outcomes', () => {
    const store = new TelemetryStore()
    store.recordOutcome('my-skill', true)
    store.recordOutcome('my-skill', false)
    const record = store.recordOutcome('my-skill', true, 4)
    expect(record.invocations).toBe(3)
    expect(record.successes).toBe(2)
    expect(record.successRate).toBeCloseTo(2 / 3)
    expect(record.turnsSavedTotal).toBe(4)
    expect(record.status).toBe('active')
  })

  it('promotes and deprecates skills', () => {
    const store = new TelemetryStore()
    store.register('my-skill')
    expect(store.promote('my-skill').status).toBe('promoted')
    expect(store.deprecate('my-skill').status).toBe('deprecated')
  })

  it('throws when promoting an unknown skill', () => {
    const store = new TelemetryStore()
    expect(() => store.promote('ghost')).toThrow(/Unknown skill/)
  })

  it('ranks the leaderboard by success rate then invocations', () => {
    const store = new TelemetryStore()
    store.recordOutcome('weak', true)
    store.recordOutcome('weak', false)
    store.recordOutcome('strong', true)
    store.recordOutcome('strong', true)
    const board = store.leaderboard()
    expect(board[0].name).toBe('strong')
    expect(board[1].name).toBe('weak')
  })

  it('restores persisted records', () => {
    const store = new TelemetryStore()
    store.recordOutcome('my-skill', true)
    const snapshot = store.leaderboard()

    const restored = new TelemetryStore()
    restored.restore(snapshot)
    expect(restored.leaderboard()[0].successRate).toBe(1)
  })
})
