import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

import { commitSkill, type FsWriteLike } from './commit.js'
import { distillSkill, parseForgeEvents } from './distill.js'
import { JsonTelemetryStorage, PersistentTelemetryStore } from './persistence.js'
import { TelemetryStore } from './telemetry.js'

export * from './distill.js'
export * from './telemetry.js'
export * from './persistence.js'
export * from './commit.js'

export const name = 'skill-forge'
export const inject = ['tools']

export interface ForgeConfig {
  /** Directory where skill telemetry persists as telemetry.json. Omit for in-memory only. */
  persistenceDir?: string
}

const JSON_TEXT_OUTPUT = {
  schema: { type: 'object' as const, additionalProperties: true },
  render: (_args: unknown, value: unknown) => [
    { type: 'text' as const, text: JSON.stringify(value, null, 2) },
  ],
}

export function apply(ctx: Context, config?: ForgeConfig): void {
  const telemetry = config?.persistenceDir
    ? new PersistentTelemetryStore(new JsonTelemetryStorage(config.persistenceDir))
    : new TelemetryStore()
  if (telemetry instanceof PersistentTelemetryStore) {
    void telemetry.hydrate()
  }

  ctx.tools.register(
    defineTool({
      name: 'forge_distill',
      description:
        'Distill a verified successful session trajectory (JSONL) into a candidate SKILL.md and register it in the forge telemetry store.',
      parameters: {
        name: { type: 'string', required: true, description: 'Kebab-case skill name' },
        description: { type: 'string', required: true, description: 'Use when... style description for the skill' },
        trajectoryJsonl: { type: 'string', required: true, description: 'Session trajectory JSONL from the verified run' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ name, description, trajectoryJsonl }) {
        const distilled = distillSkill(parseForgeEvents(trajectoryJsonl), { name, description })
        telemetry.register(name)
        return Promise.resolve(distilled)
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'forge_commit',
      description:
        'Write a candidate SKILL.md into the workspace .agents/skills/ tree through the host fs service, behind the fs/write-intent policy gate. Pair with forge_distill: distill the verified trajectory, review, then commit.',
      parameters: {
        name: { type: 'string', required: true, description: 'Kebab-case skill name (becomes the directory under the skills root)' },
        content: { type: 'string', required: true, description: 'Full SKILL.md content, typically reviewed output from forge_distill' },
        skillsDir: { type: 'string', required: false, description: 'Skills root override (default: .agents/skills)' },
      },
      output: JSON_TEXT_OUTPUT,
      async execute({ name, content, skillsDir }, exec) {
        // Defensive lookup instead of a hard inject so the plugin still
        // activates in compositions without an fs provider mounted.
        const fs = (ctx as unknown as { fs?: FsWriteLike }).fs
        if (!fs) {
          throw new Error(
            'forge_commit requires the fs service; mount an fs provider (fs-local or fs-sandbox) in this composition',
          )
        }
        const result = await commitSkill(
          fs,
          (event, target, actor, fallback) => ctx.waterfall(event, target, actor, fallback),
          exec,
          name,
          content,
          skillsDir,
        )
        telemetry.register(name)
        return result
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'forge_record_outcome',
      description:
        'Record the outcome of a skill invocation so the forge can rank skills by measured success rate.',
      parameters: {
        skillName: { type: 'string', required: true, description: 'Name of the skill that was invoked' },
        success: { type: 'boolean', required: true, description: 'Whether the invocation achieved its verified goal' },
        turnsSaved: { type: 'number', required: false, description: 'Estimated conversation turns saved vs. doing the task from scratch' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ skillName, success, turnsSaved }) {
        return Promise.resolve(telemetry.recordOutcome(skillName, success, turnsSaved ?? 0))
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'forge_leaderboard',
      description: 'Rank all tracked skills by success rate and invocation count.',
      parameters: {},
      output: JSON_TEXT_OUTPUT,
      execute() {
        return Promise.resolve({ leaderboard: telemetry.leaderboard() })
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'forge_promote',
      description: 'Promote a skill to promoted status, marking it eligible for inclusion in shipped presets.',
      parameters: {
        skillName: { type: 'string', required: true, description: 'Skill to promote' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ skillName }) {
        return Promise.resolve(telemetry.promote(skillName))
      },
    }),
  )

  ctx.tools.register(
    defineTool({
      name: 'forge_deprecate',
      description: 'Deprecate an underperforming skill so agents stop recommending it.',
      parameters: {
        skillName: { type: 'string', required: true, description: 'Skill to deprecate' },
      },
      output: JSON_TEXT_OUTPUT,
      execute({ skillName }) {
        return Promise.resolve(telemetry.deprecate(skillName))
      },
    }),
  )
}
