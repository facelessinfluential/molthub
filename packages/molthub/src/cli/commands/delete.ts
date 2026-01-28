import { readGlobalConfig } from '../../config.js'
import { apiRequest } from '../../http.js'
import { ApiRoutes, ApiV1DeleteResponseSchema, parseArk } from '../../schema/index.js'
import { getRegistry } from '../registry.js'
import type { GlobalOpts } from '../types.js'
import { createSpinner, fail, formatError, isInteractive, promptConfirm } from '../ui.js'

async function requireToken() {
  const cfg = await readGlobalConfig()
  const token = cfg?.token
  if (!token) fail('Not logged in. Run: molthub login')
  return token
}

export async function cmdDeleteSkill(
  opts: GlobalOpts,
  slugArg: string,
  options: { yes?: boolean },
  inputAllowed: boolean,
) {
  const slug = slugArg.trim().toLowerCase()
  if (!slug) fail('Slug required')
  const allowPrompt = isInteractive() && inputAllowed !== false

  if (!options.yes) {
    if (!allowPrompt) fail('Pass --yes (no input)')
    const ok = await promptConfirm(`Delete ${slug}? (soft delete)`)
    if (!ok) return
  }

  const token = await requireToken()
  const registry = await getRegistry(opts, { cache: true })
  const spinner = createSpinner(`Deleting ${slug}`)
  try {
    const result = await apiRequest(
      registry,
      { method: 'DELETE', path: `${ApiRoutes.skills}/${encodeURIComponent(slug)}`, token },
      ApiV1DeleteResponseSchema,
    )
    spinner.succeed(`OK. Deleted ${slug}`)
    return parseArk(ApiV1DeleteResponseSchema, result, 'Delete response')
  } catch (error) {
    spinner.fail(formatError(error))
    throw error
  }
}

export async function cmdUndeleteSkill(
  opts: GlobalOpts,
  slugArg: string,
  options: { yes?: boolean },
  inputAllowed: boolean,
) {
  const slug = slugArg.trim().toLowerCase()
  if (!slug) fail('Slug required')
  const allowPrompt = isInteractive() && inputAllowed !== false

  if (!options.yes) {
    if (!allowPrompt) fail('Pass --yes (no input)')
    const ok = await promptConfirm(`Undelete ${slug}?`)
    if (!ok) return
  }

  const token = await requireToken()
  const registry = await getRegistry(opts, { cache: true })
  const spinner = createSpinner(`Undeleting ${slug}`)
  try {
    const result = await apiRequest(
      registry,
      {
        method: 'POST',
        path: `${ApiRoutes.skills}/${encodeURIComponent(slug)}/undelete`,
        token,
      },
      ApiV1DeleteResponseSchema,
    )
    spinner.succeed(`OK. Undeleted ${slug}`)
    return parseArk(ApiV1DeleteResponseSchema, result, 'Undelete response')
  } catch (error) {
    spinner.fail(formatError(error))
    throw error
  }
}
