/**
 * File-backed persistence for rewind timelines. Stores one JSON document per
 * timeline in a directory so forks survive restarts and can be diffed later.
 * Persistence is opt-in via the plugin config's persistenceDir; without it the
 * store stays purely in-memory.
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  TimelineStore,
  type ForkOverrides,
  type Timeline,
  type TrajectoryEvent,
} from './trajectory.js'

export class JsonTimelineStorage {
  constructor(private readonly dir: string) {}

  async save(timeline: Timeline): Promise<void> {
    await mkdir(this.dir, { recursive: true })
    await writeFile(join(this.dir, `${timeline.id}.json`), JSON.stringify(timeline, null, 2), 'utf8')
  }

  async loadAll(): Promise<Timeline[]> {
    let entries: string[]
    try {
      entries = await readdir(this.dir)
    } catch {
      return []
    }
    const timelines: Timeline[] = []
    for (const entry of entries) {
      if (!entry.endsWith('.json')) continue
      const raw = await readFile(join(this.dir, entry), 'utf8')
      timelines.push(JSON.parse(raw) as Timeline)
    }
    return timelines
  }
}

export class PersistentTimelineStore extends TimelineStore {
  constructor(private readonly storage: JsonTimelineStorage) {
    super()
  }

  /** Restore every persisted timeline; returns how many were loaded. */
  async hydrate(): Promise<number> {
    const timelines = await this.storage.loadAll()
    for (const timeline of timelines) {
      this.restore(timeline)
    }
    return timelines.length
  }

  override load(events: TrajectoryEvent[], id?: string): Timeline {
    const timeline = super.load(events, id)
    void this.storage.save(timeline)
    return timeline
  }

  override fork(sourceId: string, atStep: number, overrides: ForkOverrides): Timeline {
    const timeline = super.fork(sourceId, atStep, overrides)
    void this.storage.save(timeline)
    return timeline
  }
}
