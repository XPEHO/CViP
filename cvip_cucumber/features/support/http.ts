/** HTTP calls to the API: base address and a minimal client that never throws on an error status. */

/** Backend address, called directly (without the proxy `/api` prefix). */
export const API_URL = process.env.API_URL ?? 'http://localhost:3000'

/** API response: HTTP status and JSON body (or text, or `null` when empty). */
export interface ApiResponse {
  status: number
  body: unknown
}

/** Sends a JSON request; `rawBody` makes it possible to send a deliberately invalid body. */
export async function callApi(
  method: string,
  path: string,
  options: { body?: unknown; rawBody?: string } = {},
): Promise<ApiResponse> {
  const payload =
    options.rawBody ?? (options.body === undefined ? undefined : JSON.stringify(options.body))
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: payload === undefined ? {} : { 'Content-Type': 'application/json' },
    body: payload,
  })
  const text = await response.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text)
    } catch {
      body = text
    }
  }
  return { status: response.status, body }
}
