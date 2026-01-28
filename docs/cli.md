---
summary: 'CLI reference: commands, flags, config, lockfile, sync behavior.'
read_when:
  - Working on CLI behavior
  - Debugging install/update/sync
---

# CLI

CLI package: `packages/molthub/` (bin: `molthub`).

From this repo you can run it via the wrapper script:

```bash
bun molthub --help
```

## Global flags

- `--workdir <dir>`: working directory (default: cwd; falls back to Moltbot workspace if configured)
- `--dir <dir>`: install dir under workdir (default: `skills`)
- `--site <url>`: base URL for browser login (default: `https://molthub.com`)
- `--registry <url>`: API base URL (default: discovered, else `https://molthub.com`)
- `--no-input`: disable prompts

Env equivalents:

- `MOLTHUB_SITE`
- `MOLTHUB_REGISTRY`
- `MOLTHUB_WORKDIR`

## Config file

Stores your API token + cached registry URL.

- macOS: `~/Library/Application Support/molthub/config.json`
- override: `MOLTHUB_CONFIG_PATH`

## Commands

### `login` / `auth login`

- Default: opens browser to `<site>/cli/auth` and completes via loopback callback.
- Headless: `molthub login --token clh_...`

### `whoami`

- Verifies the stored token via `/api/v1/whoami`.

### `star <slug>` / `unstar <slug>`

- Adds/removes a skill from your highlights.
- Calls `POST /api/v1/stars/<slug>` and `DELETE /api/v1/stars/<slug>`.
- `--yes` skips confirmation.

### `search <query...>`

- Calls `/api/v1/search?q=...`.

### `explore`

- Lists latest updated skills via `/api/v1/skills?limit=...` (sorted by `updatedAt` desc).
- Flags:
  - `--limit <n>` (1–200, default: 25)
  - `--sort newest|downloads|rating|installs|installsAllTime|trending` (default: newest)
  - `--json` (machine-readable output)
- Output: `<slug>  v<version>  <age>  <summary>` (summary truncated to 50 chars).

### `install <slug>`

- Resolves latest version via `/api/v1/skills/<slug>`.
- Downloads zip via `/api/v1/download`.
- Extracts into `<workdir>/<dir>/<slug>`.
- Writes:
  - `<workdir>/.molthub/lock.json`
  - `<skill>/.molthub/origin.json`

### `list`

- Reads `<workdir>/.molthub/lock.json`.

### `update [slug]` / `update --all`

- Computes fingerprint from local files.
- If fingerprint matches a known version: no prompt.
- If fingerprint does not match:
  - refuses by default
  - overwrites with `--force` (or prompt, if interactive)

### `publish <path>`

- Publishes via `POST /api/v1/skills` (multipart).
- Requires semver: `--version 1.2.3`.

### `sync`

- Scans for local skill folders and publishes new/changed ones.
- Roots can be any folder: a skills directory or a single skill folder with `SKILL.md`.
- Auto-adds Moltbot skill roots when `~/.moltbot/moltbot.json` is present:
  - `agent.workspace/skills` (main agent)
  - `routing.agents.*.workspace/skills` (per-agent)
  - `~/.moltbot/skills` (shared)
  - `skills.load.extraDirs` (shared packs)
- Respects `MOLTBOT_CONFIG_PATH` and `MOLTBOT_STATE_DIR`.
- Flags:
  - `--root <dir...>` extra scan roots
  - `--all` upload without prompting
  - `--dry-run` show plan only
  - `--bump patch|minor|major` (default: patch)
  - `--changelog <text>` (non-interactive)
  - `--tags a,b,c` (default: latest)
  - `--concurrency <n>` (default: 4)

Telemetry:

- Sent during `sync` when logged in, unless `MOLTHUB_DISABLE_TELEMETRY=1`.
- Details: `docs/telemetry.md`.
