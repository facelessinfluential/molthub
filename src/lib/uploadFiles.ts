import { gunzipSync, unzipSync } from 'fflate'

const TEXT_TYPES = new Map([
  ['md', 'text/markdown'],
  ['markdown', 'text/markdown'],
  ['txt', 'text/plain'],
  ['json', 'application/json'],
  ['yaml', 'text/yaml'],
  ['yml', 'text/yaml'],
  ['toml', 'text/plain'],
  ['js', 'text/javascript'],
  ['ts', 'text/plain'],
  ['tsx', 'text/plain'],
  ['jsx', 'text/plain'],
  ['css', 'text/css'],
  ['html', 'text/html'],
  ['svg', 'image/svg+xml'],
])

export async function expandFiles(selected: File[]) {
  const expanded: File[] = []
  for (const file of selected) {
    const lower = file.name.toLowerCase()
    if (lower.endsWith('.zip')) {
      const entries = unzipSync(new Uint8Array(await readArrayBuffer(file)))
      for (const [path, data] of Object.entries(entries)) {
        if (!path || path.endsWith('/')) continue
        expanded.push(
          new File([data.buffer], normalizePath(path), {
            type: guessContentType(path),
          }),
        )
      }
      continue
    }
    if (lower.endsWith('.tar.gz') || lower.endsWith('.tgz')) {
      const unpacked = gunzipSync(new Uint8Array(await readArrayBuffer(file)))
      for (const entry of untar(unpacked)) {
        expanded.push(
          new File([entry.data.buffer], normalizePath(entry.path), {
            type: guessContentType(entry.path),
          }),
        )
      }
      continue
    }
    if (lower.endsWith('.gz')) {
      const unpacked = gunzipSync(new Uint8Array(await readArrayBuffer(file)))
      const name = file.name.replace(/\.gz$/i, '')
      expanded.push(new File([unpacked.buffer], name, { type: guessContentType(name) }))
      continue
    }
    expanded.push(file)
  }
  return expanded
}

async function readArrayBuffer(file: Blob) {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer()
  }
  return new Response(file).arrayBuffer()
}

function guessContentType(path: string) {
  const ext = path.split('.').pop()?.toLowerCase()
  if (!ext) return 'text/plain'
  return TEXT_TYPES.get(ext) ?? 'text/plain'
}

function normalizePath(path: string) {
  return path.replace(/^\.\/+/, '').replace(/^\/+/, '')
}

function untar(bytes: Uint8Array) {
  const entries: Array<{ path: string; data: Uint8Array }> = []
  let offset = 0
  while (offset + 512 <= bytes.length) {
    const header = bytes.subarray(offset, offset + 512)
    if (header.every((byte) => byte === 0)) break
    const name = readString(header.subarray(0, 100))
    const size = readOctal(header.subarray(124, 136))
    const typeflag = header[156]
    offset += 512
    const data = bytes.subarray(offset, offset + size)
    offset += Math.ceil(size / 512) * 512
    if (!name || typeflag === 53) continue
    entries.push({ path: name, data })
  }
  return entries
}

function readString(bytes: Uint8Array) {
  const end = bytes.indexOf(0)
  const slice = end === -1 ? bytes : bytes.subarray(0, end)
  return new TextDecoder().decode(slice).trim()
}

function readOctal(bytes: Uint8Array) {
  const raw = readString(bytes)
  return raw ? Number.parseInt(raw, 8) : 0
}
