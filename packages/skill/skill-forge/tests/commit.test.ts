import { describe, expect, it } from 'vitest'

import {
  commitSkill,
  skillTargetPath,
  type FsWriteLike,
  type WriteIntentWaterfall,
} from '../src/commit.js'

function fakeFs() {
  const calls: Array<{ target: string; content: string; intent: unknown }> = []
  const fs: FsWriteLike = {
    writeText(target, content, intent) {
      calls.push({ target, content, intent })
      return Promise.resolve({})
    },
  }
  return { calls, fs }
}

describe('skillTargetPath', () => {
  it('builds the workspace skill path', () => {
    expect(skillTargetPath('graphene-review')).toBe('.agents/skills/graphene-review/SKILL.md')
  })

  it('honors a skillsDir override and strips trailing slashes', () => {
    expect(skillTargetPath('my-skill', 'custom/skills/')).toBe('custom/skills/my-skill/SKILL.md')
  })

  it('rejects non kebab-case names', () => {
    expect(() => skillTargetPath('Bad Name')).toThrow(/kebab-case/)
  })
})

describe('commitSkill', () => {
  it('writes through the fs/write-intent policy gate', async () => {
    const { calls, fs } = fakeFs()
    const intentMarker = { createIfAbsent: true }
    const waterfallEvents: Array<{ event: string; target: string }> = []
    const waterfall: WriteIntentWaterfall = (event, target, _exec, _fallback) => {
      waterfallEvents.push({ event, target })
      return Promise.resolve(intentMarker)
    }

    const result = await commitSkill(fs, waterfall, null, 'my-skill', '# content')

    expect(waterfallEvents).toEqual([
      { event: 'fs/write-intent', target: '.agents/skills/my-skill/SKILL.md' },
    ])
    expect(calls).toHaveLength(1)
    expect(calls[0].target).toBe('.agents/skills/my-skill/SKILL.md')
    expect(calls[0].content).toBe('# content')
    expect(calls[0].intent).toBe(intentMarker)
    expect(result).toEqual({ path: '.agents/skills/my-skill/SKILL.md', bytes: 9 })
  })

  it('uses the fallback intent when no policy occupies the gate', async () => {
    const { calls, fs } = fakeFs()
    const waterfall: WriteIntentWaterfall = (_event, _target, _exec, fallback) =>
      Promise.resolve(fallback())

    await commitSkill(fs, waterfall, null, 'my-skill', 'x')
    expect(calls[0].intent).toBeUndefined()
  })

  it('rejects invalid names before touching the filesystem', async () => {
    const { calls, fs } = fakeFs()
    const waterfall: WriteIntentWaterfall = () => Promise.resolve(undefined)
    await expect(commitSkill(fs, waterfall, null, 'Nope', 'x')).rejects.toThrow(/kebab-case/)
    expect(calls).toHaveLength(0)
  })
})
