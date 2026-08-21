import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { JsonTelemetryStorage, PersistentTelemetryStore } from '../src/persistence.js'

describe('JsonTelemetryStorage', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dsh-forge-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('round-trips telemetry records through telemetry.json', async () => {
    const storage = new JsonTelemetryStorage(dir)
    const store = new PersistentTelemetryStore(storage)
    store.recordOutcome('my-skill', true, 3)
    await storage.save(store.leaderboard())

    const reloaded = new PersistentTelemetryStore(new JsonTelemetryStorage(dir))
    expect(await reloaded.hydrate()).toBe(1)
    const record = reloaded.leaderboard()[0]
    expect(record.name).toBe('my-skill')
    expect(record.turnsSavedTotal).toBe(3)
  })

  it('loads an empty list when no file exists', async () => {
    const storage = new JsonTelemetryStorage(join(dir, 'missing'))
    expect(await storage.load()).toEqual([])
  })
})
