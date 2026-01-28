import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import JSON5 from 'json5'

type MoltbotConfig = {
  agent?: { workspace?: string }
  agents?: {
    defaults?: { workspace?: string }
    list?: Array<{
      id?: string
      name?: string
      workspace?: string
      default?: boolean
    }>
  }
  routing?: {
    agents?: Record<
      string,
      {
        name?: string
        workspace?: string
      }
    >
  }
  skills?: {
    load?: {
      extraDirs?: string[]
    }
  }
}

export type MoltbotSkillRoots = {
  roots: string[]
  labels: Record<string, string>
}

export async function resolveMoltbotSkillRoots(): Promise<MoltbotSkillRoots> {
  const roots: string[] = []
  const labels: Record<string, string> = {}

  const stateDir = resolveMoltbotStateDir()
  const sharedSkills = resolveUserPath(join(stateDir, 'skills'))
  pushRoot(roots, labels, sharedSkills, 'Shared skills')

  const config = await readMoltbotConfig()
  if (!config) return { roots, labels }

  const mainWorkspace = resolveUserPath(
    config.agents?.defaults?.workspace ?? config.agent?.workspace ?? '',
  )
  if (mainWorkspace) {
    pushRoot(roots, labels, join(mainWorkspace, 'skills'), 'Agent: main')
  }

  const listedAgents = config.agents?.list ?? []
  for (const entry of listedAgents) {
    const workspace = resolveUserPath(entry?.workspace ?? '')
    if (!workspace) continue
    const name = entry?.name?.trim() || entry?.id?.trim() || 'agent'
    pushRoot(roots, labels, join(workspace, 'skills'), `Agent: ${name}`)
  }

  const agents = config.routing?.agents ?? {}
  for (const [agentId, entry] of Object.entries(agents)) {
    const workspace = resolveUserPath(entry?.workspace ?? '')
    if (!workspace) continue
    const name = entry?.name?.trim() || agentId
    pushRoot(roots, labels, join(workspace, 'skills'), `Agent: ${name}`)
  }

  const extraDirs = config.skills?.load?.extraDirs ?? []
  for (const dir of extraDirs) {
    const resolved = resolveUserPath(String(dir))
    if (!resolved) continue
    const label = `Extra: ${basename(resolved) || resolved}`
    pushRoot(roots, labels, resolved, label)
  }

  return { roots, labels }
}

export async function resolveMoltbotDefaultWorkspace(): Promise<string | null> {
  const config = await readMoltbotConfig()
  if (!config) return null

  const defaultsWorkspace = resolveUserPath(
    config.agents?.defaults?.workspace ?? config.agent?.workspace ?? '',
  )
  if (defaultsWorkspace) return defaultsWorkspace

  const listedAgents = config.agents?.list ?? []
  const defaultAgent =
    listedAgents.find((entry) => entry.default) ?? listedAgents.find((entry) => entry.id === 'main')
  const listWorkspace = resolveUserPath(defaultAgent?.workspace ?? '')
  return listWorkspace || null
}

function resolveMoltbotStateDir() {
  const override = process.env.MOLTBOT_STATE_DIR?.trim()
  if (override) return resolveUserPath(override)
  return join(homedir(), '.moltbot')
}

function resolveMoltbotConfigPath() {
  const override = process.env.MOLTBOT_CONFIG_PATH?.trim()
  if (override) return resolveUserPath(override)
  return join(resolveMoltbotStateDir(), 'moltbot.json')
}

function resolveUserPath(input: string) {
  const trimmed = input.trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('~')) {
    return resolve(trimmed.replace(/^~(?=$|[\\/])/, homedir()))
  }
  return resolve(trimmed)
}

async function readMoltbotConfig(): Promise<MoltbotConfig | null> {
  try {
    const raw = await readFile(resolveMoltbotConfigPath(), 'utf8')
    const parsed = JSON5.parse(raw)
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as MoltbotConfig
  } catch {
    return null
  }
}

function pushRoot(roots: string[], labels: Record<string, string>, root: string, label?: string) {
  const resolved = resolveUserPath(root)
  if (!resolved) return
  if (!roots.includes(resolved)) roots.push(resolved)
  if (!label) return
  const existing = labels[resolved]
  if (!existing) {
    labels[resolved] = label
    return
  }
  const parts = existing
    .split(', ')
    .map((part) => part.trim())
    .filter(Boolean)
  if (parts.includes(label)) return
  labels[resolved] = `${existing}, ${label}`
}
