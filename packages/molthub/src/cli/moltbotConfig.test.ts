/* @vitest-environment node */
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { resolveMoltbotDefaultWorkspace, resolveMoltbotSkillRoots } from './moltbotConfig.js'

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe('resolveMoltbotSkillRoots', () => {
  it('reads JSON5 config and resolves per-agent + shared skill roots', async () => {
    const base = await mkdtemp(join(tmpdir(), 'molthub-moltbot-'))
    const home = join(base, 'home')
    const stateDir = join(base, 'state')
    const configPath = join(base, 'moltbot.json')

    process.env.HOME = home
    process.env.MOLTBOT_STATE_DIR = stateDir
    process.env.MOLTBOT_CONFIG_PATH = configPath

    const config = `{
      // JSON5 comments + trailing commas supported
      agents: {
        defaults: { workspace: '~/molt-main', },
        list: [
          { id: 'work', name: 'Work Bot', workspace: '~/molt-work', },
          { id: 'family', workspace: '~/molt-family', },
        ],
      },
      // legacy entries still supported
      agent: { workspace: '~/molt-legacy', },
      routing: {
        agents: {
          work: { name: 'Work Bot', workspace: '~/molt-work', },
          family: { workspace: '~/molt-family' },
        },
      },
      skills: {
        load: { extraDirs: ['~/shared/skills', '/opt/skills',], },
      },
    }`
    await writeFile(configPath, config, 'utf8')

    const { roots, labels } = await resolveMoltbotSkillRoots()

    const expectedRoots = [
      resolve(stateDir, 'skills'),
      resolve(home, 'molt-main', 'skills'),
      resolve(home, 'molt-work', 'skills'),
      resolve(home, 'molt-family', 'skills'),
      resolve(home, 'shared', 'skills'),
      resolve('/opt/skills'),
    ]

    expect(roots).toEqual(expect.arrayContaining(expectedRoots))
    expect(labels[resolve(stateDir, 'skills')]).toBe('Shared skills')
    expect(labels[resolve(home, 'molt-main', 'skills')]).toBe('Agent: main')
    expect(labels[resolve(home, 'molt-work', 'skills')]).toBe('Agent: Work Bot')
    expect(labels[resolve(home, 'molt-family', 'skills')]).toBe('Agent: family')
    expect(labels[resolve(home, 'shared', 'skills')]).toBe('Extra: skills')
    expect(labels[resolve('/opt/skills')]).toBe('Extra: skills')
  })

  it('resolves default workspace from agents.defaults and agents.list', async () => {
    const base = await mkdtemp(join(tmpdir(), 'molthub-moltbot-default-'))
    const home = join(base, 'home')
    const stateDir = join(base, 'state')
    const configPath = join(base, 'moltbot.json')
    const workspaceMain = join(base, 'workspace-main')
    const workspaceList = join(base, 'workspace-list')

    process.env.HOME = home
    process.env.MOLTBOT_STATE_DIR = stateDir
    process.env.MOLTBOT_CONFIG_PATH = configPath

    const config = `{
      agents: {
        defaults: { workspace: "${workspaceMain}", },
        list: [
          { id: 'main', workspace: "${workspaceList}", default: true },
        ],
      },
    }`
    await writeFile(configPath, config, 'utf8')

    const workspace = await resolveMoltbotDefaultWorkspace()
    expect(workspace).toBe(resolve(workspaceMain))
  })

  it('falls back to default agent in agents.list when defaults missing', async () => {
    const base = await mkdtemp(join(tmpdir(), 'molthub-moltbot-list-'))
    const home = join(base, 'home')
    const configPath = join(base, 'moltbot.json')
    const workspaceMain = join(base, 'workspace-main')
    const workspaceWork = join(base, 'workspace-work')

    process.env.HOME = home
    process.env.MOLTBOT_CONFIG_PATH = configPath

    const config = `{
      agents: {
        list: [
          { id: 'main', workspace: "${workspaceMain}", default: true },
          { id: 'work', workspace: "${workspaceWork}" },
        ],
      },
    }`
    await writeFile(configPath, config, 'utf8')

    const workspace = await resolveMoltbotDefaultWorkspace()
    expect(workspace).toBe(resolve(workspaceMain))
  })

  it('respects MOLTBOT_STATE_DIR and MOLTBOT_CONFIG_PATH overrides', async () => {
    const base = await mkdtemp(join(tmpdir(), 'molthub-moltbot-override-'))
    const home = join(base, 'home')
    const stateDir = join(base, 'custom-state')
    const configPath = join(base, 'config', 'moltbot.json')

    process.env.HOME = home
    process.env.MOLTBOT_STATE_DIR = stateDir
    process.env.MOLTBOT_CONFIG_PATH = configPath

    const config = `{
      agent: { workspace: "${join(base, 'workspace-main')}" },
    }`
    await mkdir(join(base, 'config'), { recursive: true })
    await writeFile(configPath, config, 'utf8')

    const { roots, labels } = await resolveMoltbotSkillRoots()

    expect(roots).toEqual(
      expect.arrayContaining([
        resolve(stateDir, 'skills'),
        resolve(join(base, 'workspace-main'), 'skills'),
      ]),
    )
    expect(labels[resolve(stateDir, 'skills')]).toBe('Shared skills')
    expect(labels[resolve(join(base, 'workspace-main'), 'skills')]).toBe('Agent: main')
  })

  it('returns shared skills root when config is missing', async () => {
    const base = await mkdtemp(join(tmpdir(), 'molthub-moltbot-missing-'))
    const stateDir = join(base, 'state')
    const configPath = join(base, 'missing', 'moltbot.json')

    process.env.MOLTBOT_STATE_DIR = stateDir
    process.env.MOLTBOT_CONFIG_PATH = configPath

    const { roots, labels } = await resolveMoltbotSkillRoots()

    expect(roots).toEqual([resolve(stateDir, 'skills')])
    expect(labels[resolve(stateDir, 'skills')]).toBe('Shared skills')
  })
})
