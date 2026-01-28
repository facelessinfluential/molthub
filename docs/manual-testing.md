---
summary: 'Copy/paste CLI smoke checklist for local verification.'
read_when:
  - Pre-merge validation
  - Reproducing a reported CLI bug
---

# Manual testing (CLI)

## Setup
- Ensure logged in: `bun molthub whoami` (or `bun molthub login`).
- Optional: set env
  - `MOLTHUB_SITE=https://molthub.com`
  - `MOLTHUB_REGISTRY=https://molthub.com`

## Smoke
- `bun molthub --help`
- `bun molthub --cli-version`
- `bun molthub whoami`

## Search
- `bun molthub search gif --limit 5`

## Install / list / update
- `mkdir -p /tmp/molthub-manual && cd /tmp/molthub-manual`
- `bunx molthub@beta install gifgrep --force`
- `bunx molthub@beta list`
- `bunx molthub@beta update gifgrep --force`

## Publish (changelog optional)
- `mkdir -p /tmp/molthub-skill-demo/SKILL && cd /tmp/molthub-skill-demo`
- Create files:
  - `SKILL.md`
  - `notes.md`
- Publish:
  - `bun molthub publish . --slug molthub-manual-<ts> --name "Manual <ts>" --version 1.0.0 --tags latest`
- Publish update with empty changelog:
  - `bun molthub publish . --slug molthub-manual-<ts> --name "Manual <ts>" --version 1.0.1 --tags latest`

## Delete / undelete (owner/admin)
- `bun molthub delete molthub-manual-<ts> --yes`
- Verify hidden:
- `curl -i "https://molthub.com/api/v1/skills/molthub-manual-<ts>"`
- Restore:
  - `bun molthub undelete molthub-manual-<ts> --yes`
- Cleanup:
  - `bun molthub delete molthub-manual-<ts> --yes`

## Sync
- `bun molthub sync --dry-run --all`

## Playwright (menu smoke)

Run against prod:

```
PLAYWRIGHT_BASE_URL=https://molthub.com bun run test:pw
```

Run against a local preview server:

```
bun run test:e2e:local
```
