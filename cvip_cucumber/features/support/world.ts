/** Scenario context: current response, created items and substitution of the placeholders in texts. */
import { setWorldConstructor, World } from '@cucumber/cucumber'
import type { ApiResponse } from './http.ts'

/** Value of a field of a JSON object, or `undefined` if the body is not an object. */
export function fieldOf(body: unknown, field: string): unknown {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return undefined
  return (body as Record<string, unknown>)[field]
}

/** Context shared by the steps of a scenario; one instance per scenario. */
export class CvipWorld extends World {
  /** Unique suffix: isolates the scenario data (the referentials have no deletion). */
  readonly tag = `E2E-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  /** Base rank of the levels created (high and random so the default scale is left untouched). */
  readonly rank = 1000 + Math.floor(Math.random() * 30000)
  /** Items created by the scenario, retrievable by their short name. */
  readonly items = new Map<string, Record<string, unknown>>()
  response: ApiResponse = { status: 0, body: null }

  /** Replaces `{tag}`, `{rank}`, `{rank+1}` and `{id:name}` with the scenario values. */
  fill(text: string): string {
    return text
      .replaceAll('{tag}', this.tag)
      .replaceAll('{rank+1}', String(this.rank + 1))
      .replaceAll('{rank}', String(this.rank))
      .replace(/\{id:([\w-]+)\}/g, (_match, name: string) => this.idOf(name))
  }

  /** Identifier of an item created earlier in the scenario. */
  idOf(name: string): string {
    const id = this.items.get(name)?.id
    if (typeof id !== 'string')
      throw new Error(`Aucun élément « ${name} » n'a été créé dans ce scénario.`)
    return id
  }
}

setWorldConstructor(CvipWorld)
