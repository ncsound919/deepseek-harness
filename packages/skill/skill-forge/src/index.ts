import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'

import { distillSkill, parseForgeEvents } from './distill.js'
import { TelemetryStore } from './telemetry.js'

export * from './distill.js'
export * from './telemetry.js'

export const name = 'skill-forge'
export const inject = ['tools']

const JSON_TEXT_OUTPUT = {
  schema: { type: 'object' as const, additionalProperties: true },
  render: (_args: unknown, value: unknown) => [
    { type: 'text' as const, text: JSON.stringify(value, null, 2) },
  ],
}

const telemetry = new TelemetryStore()

export function apply(ctx: Context): void {
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
