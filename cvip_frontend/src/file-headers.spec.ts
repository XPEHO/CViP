import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SOURCE_ROOT = path.dirname(fileURLToPath(import.meta.url))
// Tests and type declarations: not commented element by element.
const EXEMPT = /\.spec\.ts$|\.d\.ts$/

/** TypeScript and Vue files of a folder, recursively. */
function listSourceFiles(folder: string): string[] {
  return readdirSync(folder, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(folder, entry.name)
    if (entry.isDirectory()) return listSourceFiles(entryPath)
    const isSource = /\.(ts|vue)$/.test(entry.name) && !EXEMPT.test(entryPath)
    return isSource ? [entryPath] : []
  })
}

/** First non-empty line of the `<script>` content of a Vue component. */
function firstLineOfScript(content: string): string {
  const start = content.indexOf('<script')
  const body = content.slice(content.indexOf('>', start) + 1)
  return (
    body
      .split(/\r?\n/)
      .find((line) => line.trim() !== '')
      ?.trim() ?? ''
  )
}

/** Text that must start with the description comment: the file, or the script of a `.vue`. */
function headerSource(file: string, content: string): string {
  if (!file.endsWith('.vue')) return content.trimStart().split(/\r?\n/, 1)[0] ?? ''
  if (content.trimStart().startsWith('<!--')) return '<!-- en-tête HTML -->'
  return firstLineOfScript(content)
}

describe('en-têtes de fichier', () => {
  const files = listSourceFiles(SOURCE_ROOT)

  it('trouve les fichiers source', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it.each(files.map((file) => [path.relative(SOURCE_ROOT, file), file]))(
    '%s commence par un commentaire de description',
    (_name, file) => {
      const source = headerSource(file as string, readFileSync(file as string, 'utf8'))
      expect(source).toMatch(/^\/\*\*.*\*\/$|^<!--/)
    },
  )
})
