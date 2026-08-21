/**
 * File-backed persistence for skill telemetry. Stores the full leaderboard as
 * a single telemetry.json document so skill rankings survive restarts.
 * Persistence is opt-in via the plugin config's persistenceDir.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { TelemetryStore, type SkillStatus, type SkillTelemetry } from './telemetry.js'

export class JsonTelemetryStorage {
  private readonly file: string

  constructor(dir: string) {
    this.file = join(dir, 'telemetry.json')
  }

  async load(): Promise<SkillTelemetry[]> {
    try {
      const raw = await readFile(this.file, 'utf8')
      return JSON.parse(raw) as SkillTelemetry[]
    } catch {
      return []
    }
  }

  async save(records: SkillTelemetry[]): Promise<void> {
    await mkdir(dirname(this.file), { recursive: true })
    await writeFile(this.file, JSON.stringify(records, null, 2), 'utf8')
  }
}

export class PersistentTelemetryStore extends TelemetryStore {
  constructor(private readonly storage: JsonTelemetryStorage) {
    super()
  }

  /** Restore persisted records; returns how many were loaded. */
  async hydrate(): Promise<number> {
    const records = await this.storage.load()
    this.restore(records)
    return records.length
  }

  override register(name: string, status: SkillStatus = 'candidate'): SkillTelemetry {
    const record = super.register(name, status)
    void this.storage.save(this.leaderboard())
    return record
  }

  override recordOutcome(name: string, success: boolean, turnsSaved = 0): SkillTelemetry {
    const record = super.recordOutcome(name, success, turnsSaved)
    void this.storage.save(this.leaderboard())
    return record
  }

  override promote(name: string): SkillTelemetry {
    const record = super.promote(name)
    void this.storage.save(this.leaderboard())
    return record
  }

  override deprecate(name: string): SkillTelemetry {
    const record = super.deprecate(name)
    void this.storage.save(this.leaderboard())
    return record
  }
}
