/**
 * Skill telemetry: track invocations, success rate, and estimated turns saved
 * per skill, and drive the promote/deprecate lifecycle from measured outcomes
 * instead of vibes.
 */

export type SkillStatus = 'candidate' | 'active' | 'promoted' | 'deprecated'

export interface SkillTelemetry {
  name: string
  invocations: number
  successes: number
  failures: number
  turnsSavedTotal: number
  status: SkillStatus
  successRate: number
  lastUsedAt: string | null
}

function fresh(name: string, status: SkillStatus): SkillTelemetry {
  return {
    name,
    invocations: 0,
    successes: 0,
    failures: 0,
    turnsSavedTotal: 0,
    status,
    successRate: 0,
    lastUsedAt: null,
  }
}

export class TelemetryStore {
  private readonly records = new Map<string, SkillTelemetry>()

  register(name: string, status: SkillStatus = 'candidate'): SkillTelemetry {
    const existing = this.records.get(name)
    if (existing) return { ...existing }
    const record = fresh(name, status)
    this.records.set(name, record)
    return { ...record }
  }

  recordOutcome(name: string, success: boolean, turnsSaved = 0): SkillTelemetry {
    const record = this.records.get(name) ?? fresh(name, 'active')
    record.invocations += 1
    if (success) record.successes += 1
    else record.failures += 1
    record.turnsSavedTotal += Math.max(0, turnsSaved)
    record.successRate = record.successes / record.invocations
    record.lastUsedAt = new Date().toISOString()
    if (record.status === 'candidate') record.status = 'active'
    this.records.set(name, record)
    return { ...record }
  }

  promote(name: string): SkillTelemetry {
    return this.setStatus(name, 'promoted')
  }

  deprecate(name: string): SkillTelemetry {
    return this.setStatus(name, 'deprecated')
  }

  leaderboard(): SkillTelemetry[] {
    return [...this.records.values()]
      .map((record) => ({ ...record }))
      .sort((a, b) => b.successRate - a.successRate || b.invocations - a.invocations)
  }

  /** Restore previously persisted records without altering their lifecycle state. */
  restore(records: SkillTelemetry[]): void {
    for (const record of records) {
      this.records.set(record.name, { ...record })
    }
  }

  private setStatus(name: string, status: SkillStatus): SkillTelemetry {
    const record = this.records.get(name)
    if (!record) throw new Error(`Unknown skill: ${name}`)
    record.status = status
    return { ...record }
  }
}
