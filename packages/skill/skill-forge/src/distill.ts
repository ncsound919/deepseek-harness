/**
 * Skill distillation: turn a verified successful session trajectory into a
 * candidate SKILL.md that the harness can reuse. Only trajectories containing
 * at least one tool call are distillable; the generated file is a candidate
 * and should be reviewed before promotion.
 */

export interface ForgeEvent {
  type: string
  payload: Record<string, unknown>
}

export interface DistillOptions {
  name: string
  description: string
}

export interface DistilledSkill {
  fileName: string
  content: string
  toolChain: string[]
}

const SKILL_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function parseForgeEvents(jsonl: string): ForgeEvent[] {
  const events: ForgeEvent[] = []
  const lines = jsonl.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const raw = JSON.parse(line) as Partial<ForgeEvent>
    if (typeof raw.type !== 'string') {
      throw new Error(`Invalid trajectory event on line ${i + 1}: missing type`)
    }
    events.push({ type: raw.type, payload: (raw.payload ?? {}) as Record<string, unknown> })
  }
  return events
}

export function distillSkill(events: ForgeEvent[], options: DistillOptions): DistilledSkill {
  if (!SKILL_NAME_PATTERN.test(options.name)) {
    throw new Error(`Invalid skill name "${options.name}": use kebab-case`)
  }
  const toolChain = events
    .filter((event) => event.type === 'tool_call')
    .map((event) => String(event.payload.name ?? 'unknown_tool'))
  if (toolChain.length === 0) {
    throw new Error('Cannot distill a skill from a trajectory with no tool calls')
  }
  const uniqueChain = [...new Set(toolChain)]
  const steps = uniqueChain
    .map((tool, index) => `${index + 1}. **${tool}** — replicate the verified invocation pattern from the source trajectory.`)
    .join('\n')
  const content = [
    '---',
    `name: ${options.name}`,
    `description: ${options.description}`,
    '---',
    '',
    `# ${options.name}`,
    '',
    '> Distilled by skill-forge from a verified successful session. Review before promoting.',
    '',
    '## Verified Tool Chain',
    '',
    steps,
    '',
    '## Protocol',
    '',
    '1. Follow the tool chain above in order; it produced a verified successful outcome.',
    '2. Record the outcome with forge_record_outcome so telemetry can rank this skill.',
    '',
  ].join('\n')
  return { fileName: 'SKILL.md', content, toolChain: uniqueChain }
}
