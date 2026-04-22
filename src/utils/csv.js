export function parseCsv(text, { delimiter = ',', maxRows = 2000 } = {}) {
  if (typeof text !== 'string') return { ok: false, error: 'not_string', value: null }
  const lines = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .filter((x) => x.trim().length > 0)

  if (lines.length === 0) return { ok: false, error: 'empty', value: null }

  const headers = splitCsvLine(lines[0], delimiter).map((h) => h.trim())
  if (headers.length === 0) return { ok: false, error: 'no_headers', value: null }

  const rows = []
  for (let i = 1; i < Math.min(lines.length, maxRows + 1); i++) {
    const cells = splitCsvLine(lines[i], delimiter)
    const obj = {}
    for (let j = 0; j < headers.length; j++) obj[headers[j]] = (cells[j] ?? '').trim()
    rows.push(obj)
  }

  return { ok: true, error: null, value: { columns: headers, rows } }
}

function splitCsvLine(line, delimiter) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      const next = line[i + 1]
      if (inQuotes && next === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
      continue
    }
    if (!inQuotes && ch === delimiter) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out
}

