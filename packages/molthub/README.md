# `molthub`

MoltHub CLI — install, update, search, and publish agent skills as folders.

## Install

```bash
# From this repo (shortcut script at repo root)
bun molthub --help

# Once published to npm
# npm i -g molthub
```

## Auth (publish)

```bash
molthub login
# or
molthub auth login

# Headless / token paste
# or (token paste / headless)
molthub login --token clh_...
```

Notes:

- Browser login opens `https://molthub.com/cli/auth` and completes via a loopback callback.
- Token stored in `~/Library/Application Support/molthub/config.json` on macOS (override via `MOLTHUB_CONFIG_PATH`).

## Examples

```bash
molthub search "postgres backups"
molthub install my-skill-pack
molthub update --all
molthub update --all --no-input --force
molthub publish ./my-skill-pack --slug my-skill-pack --name "My Skill Pack" --version 1.2.0 --changelog "Fixes + docs"
```

## Sync (upload local skills)

```bash
# Start anywhere; scans workdir first, then legacy Moltbot/Molt locations.
molthub sync

# Explicit roots + non-interactive dry-run
molthub sync --root ../moltbot/skills --all --dry-run
```

## Defaults

- Site: `https://molthub.com` (override via `--site` or `MOLTHUB_SITE`)
- Registry: discovered from `/.well-known/molthub.json` on the site (override via `--registry` or `MOLTHUB_REGISTRY`)
- Workdir: current directory (falls back to Moltbot workspace if configured; override via `--workdir` or `MOLTHUB_WORKDIR`)
- Install dir: `./skills` under workdir (override via `--dir`)
