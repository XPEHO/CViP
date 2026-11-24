import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

// Tests run from dist/: the sources are in the sibling src/ folder.
const SRC = fileURLToPath(new URL('../src', import.meta.url))

const sources = readdirSync(SRC, { recursive: true, encoding: 'utf8' })
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts') && !file.endsWith('.d.ts'))
  .map((file) => ({ file, lines: readFileSync(join(SRC, file), 'utf8').split('\n') }))

const isOneLineDoc = (line: string | undefined) => /^\/\*\*.*\*\/$/.test(line?.trim() ?? '')

test('chaque fichier source commence par un commentaire /** … */ d’une ligne', () => {
  assert.ok(sources.length > 0)
  const missing = sources.filter(({ lines }) => !isOneLineDoc(lines[0])).map(({ file }) => file)
  assert.deepEqual(missing, [])
})

test('chaque élément exporté est précédé d’un commentaire /** … */', () => {
  const missing: string[] = []
  for (const { file, lines } of sources) {
    lines.forEach((line, index) => {
      if (!/^export (const|function|class|abstract class|interface|type|enum) /.test(line)) return
      // A decorator (@Entity…) may sit between the comment and the class.
      let previous = index - 1
      while (previous >= 0 && lines[previous]?.startsWith('@')) previous -= 1
      const doc = lines[previous]?.trim() ?? ''
      if (!doc.endsWith('*/')) missing.push(`${file}:${index + 1} ${line.slice(0, 50)}`)
    })
  }
  assert.deepEqual(missing, [])
})
