/** Integration test utilities: ephemeral Postgres, HTTP server and fetch client. */
import type { Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { fileURLToPath } from 'node:url'
import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { runner } from 'node-pg-migrate'
import pg from 'pg'

const MIGRATIONS_DIR = fileURLToPath(new URL('../../migrations', import.meta.url))

/** JSON response of the API; `body` stays untyped, each test inspects it as needed. */
export interface ApiResponse {
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
}

/** Minimal HTTP client of the API under test. */
export interface ApiClient {
  get: (path: string) => Promise<ApiResponse>
  post: (path: string, body?: unknown) => Promise<ApiResponse>
  patch: (path: string, body?: unknown) => Promise<ApiResponse>
  put: (path: string, body?: unknown) => Promise<ApiResponse>
  /** Sends an already serialized body, including malformed JSON. */
  postRaw: (path: string, rawBody: string) => Promise<ApiResponse>
}

/** Migrated ephemeral Postgres database; `pool` serves fixtures and direct SQL checks. */
export interface TestDatabase {
  url: string
  pool: pg.Pool
  stop: () => Promise<void>
}

/** Test HTTP server, reachable through `api`. */
export interface TestServer {
  baseUrl: string
  api: ApiClient
  close: () => Promise<void>
}

/**
 * Starts an ephemeral Postgres, runs the migrations and sets `DATABASE_URL`.
 * Call it before any dynamic import of the application: the configuration reads `DATABASE_URL` at import time.
 */
export const startTestDatabase = async (): Promise<TestDatabase> => {
  const container = await new PostgreSqlContainer('postgres:18-alpine').start()
  const url = container.getConnectionUri()
  await runner({
    databaseUrl: url,
    dir: MIGRATIONS_DIR,
    migrationsTable: 'pgmigrations',
    direction: 'up',
    log: () => {},
  })
  process.env.DATABASE_URL = url
  const pool = new pg.Pool({ connectionString: url })

  return {
    url,
    pool,
    stop: async () => {
      await pool.end()
      await container.stop()
    },
  }
}

/** Test HTTP client bound to `baseUrl`. */
const createClient = (baseUrl: string): ApiClient => {
  /** Sends a request and returns the status and the decoded JSON body. */
  const send = async (method: string, path: string, body?: string): Promise<ApiResponse> => {
    const res = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body,
    })
    const text = await res.text()
    return { status: res.status, body: text ? JSON.parse(text) : undefined }
  }
  /** Serializes a request body, or `undefined` when there is none. */
  const json = (body: unknown) => (body === undefined ? undefined : JSON.stringify(body))

  return {
    get: (path) => send('GET', path),
    post: (path, body) => send('POST', path, json(body)),
    patch: (path, body) => send('PATCH', path, json(body)),
    put: (path, body) => send('PUT', path, json(body)),
    postRaw: (path, rawBody) => send('POST', path, rawBody),
  }
}

/**
 * Initializes the TypeORM data source, then starts the application on a free port.
 * Imports are dynamic: `startTestDatabase` must have set `DATABASE_URL` first.
 */
export const startTestServer = async (): Promise<TestServer> => {
  const { AppDataSource } = await import('../db/data-source.ts')
  const { createApp } = await import('../app.ts')
  await AppDataSource.initialize()

  const server = await new Promise<Server>((resolve) => {
    const listening = createApp().listen(0, () => resolve(listening))
  })
  const baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`

  return {
    baseUrl,
    api: createClient(baseUrl),
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()))
      await AppDataSource.destroy()
    },
  }
}
