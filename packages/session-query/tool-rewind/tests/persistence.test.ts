import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { JsonTimelineStorage, PersistentTimelineStore } from '../src/persistence.js'
import { parseTrajectoryJsonl } from '../src/trajectory.js'

const SAMPLE_JSONL = [
  JSON.stringify({ step: 0, type: 'user_message', timestamp: '2026-08-21T00:00:00Z', payload: { text: 'hello' } }),
  JSON.stringify({ step: 1, type: 'tool_call', timestamp: '2026-08-21T00:00:01Z', payload: { name: 'convert_unit' } }),
].join('\n')

describe('JsonTimelineStorage', () => {
  let dir: string

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'dsh-rewind-'))
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('round-trips timelines through JSON files', async () => {
    const storage = new JsonTimelineStorage(dir)
    const store = new PersistentTimelineStore(storage)
    const root = store.load(parseTrajectoryJsonl(SAMPLE_JSONL))
    const fork = store.fork(root.id, 1, { model: 'deepseek-r1' })
    await storage.save(root)
    await storage.save(fork)

    const reloaded = new PersistentTimelineStore(new JsonTimelineStorage(dir))
    const count = await reloaded.hydrate()
    expect(count).toBe(2)
    expect(reloaded.get(fork.id).overrides.model).toBe('deepseek-r1')
    expect(reloaded.get(root.id).events).toHaveLength(2)
  })

  it('hydrates to zero when the directory does not exist', async () => {
    const store = new PersistentTimelineStore(new JsonTimelineStorage(join(dir, 'missing')))
    expect(await store.hydrate()).toBe(0)
  })
})
