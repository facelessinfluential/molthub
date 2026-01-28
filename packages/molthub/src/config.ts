import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { type GlobalConfig, GlobalConfigSchema, parseArk } from './schema/index.js'

export function getGlobalConfigPath() {
  const override = process.env.MOLTHUB_CONFIG_PATH?.trim()
  if (override) return resolve(override)
  const home = homedir()
  if (process.platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'molthub', 'config.json')
  }
  const xdg = process.env.XDG_CONFIG_HOME
  if (xdg) return join(xdg, 'molthub', 'config.json')
  if (process.platform === 'win32') {
    const appData = process.env.APPDATA
    if (appData) return join(appData, 'molthub', 'config.json')
  }
  return join(home, '.config', 'molthub', 'config.json')
}

export async function readGlobalConfig(): Promise<GlobalConfig | null> {
  try {
    const raw = await readFile(getGlobalConfigPath(), 'utf8')
    const parsed = JSON.parse(raw) as unknown
    return parseArk(GlobalConfigSchema, parsed, 'Global config')
  } catch {
    return null
  }
}

export async function writeGlobalConfig(config: GlobalConfig) {
  const path = getGlobalConfigPath()
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(config, null, 2)}\n`, 'utf8')
}
