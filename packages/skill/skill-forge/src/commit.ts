/**
 * Write-back for distilled skills: commit a candidate SKILL.md into the
 * workspace's .agents/skills/ tree through the host's policy-aware fs service,
 * so the self-improvement loop closes without manual file creation.
 *
 * Verified upstream surface (deepseek-ai/deepseek-harness, packages/fs):
 * - ctx.fs.writeText(target, content, intent) is the atomic write primitive
 * - the optional policy intent comes from
 *   ctx.waterfall('fs/write-intent', target, exec, () => undefined)
 * - relative targets resolve against the session cwd, and fs-sandbox fences
 *   writes to the workspace in workspace-write mode
 */

import { SKILL_NAME_PATTERN } from './distill.js'

export interface FsWriteLike {
  writeText(target: string, content: string, intent?: unknown): Promise<unknown>
}

export type WriteIntentWaterfall = (
  event: 'fs/write-intent',
  target: string,
  exec: unknown,
  fallback: () => undefined,
) => Promise<unknown>

export interface CommitResult {
  path: string
  bytes: number
}

export function skillTargetPath(name: string, skillsDir = '.agents/skills'): string {
  if (!SKILL_NAME_PATTERN.test(name)) {
    throw new Error(`Invalid skill name "${name}": use kebab-case`)
  }
  const root = skillsDir.replace(/\/+$/, '')
  return `${root}/${name}/SKILL.md`
}

export async function commitSkill(
  fs: FsWriteLike,
  waterfall: WriteIntentWaterfall,
  exec: unknown,
  name: string,
  content: string,
  skillsDir?: string,
): Promise<CommitResult> {
  const target = skillTargetPath(name, skillsDir)
  const intent = await waterfall('fs/write-intent', target, exec, () => undefined)
  await fs.writeText(target, content, intent)
  return { path: target, bytes: content.length }
}
