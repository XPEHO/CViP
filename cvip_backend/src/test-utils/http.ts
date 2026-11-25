/** Fake Express objects for the unit tests of mappers, controllers and middlewares. */
import type { Request, Response } from 'express'

/** Fake response that records the status and JSON body sent. */
export interface FakeResponse {
  statusCode: number
  body: unknown
  status: (code: number) => FakeResponse
  json: (body: unknown) => FakeResponse
}

/** Creates a fake response (status 200 by default). */
export const fakeRes = (): FakeResponse => {
  const res: FakeResponse = {
    statusCode: 200,
    body: undefined,
    status(code) {
      res.statusCode = code
      return res
    },
    json(body) {
      res.body = body
      return res
    },
  }
  return res
}

/** Fake request with params, query and body. */
export const fakeReq = (
  parts: { params?: Record<string, string>; query?: Record<string, unknown>; body?: unknown } = {},
): Request => ({ params: {}, query: {}, body: undefined, ...parts }) as unknown as Request

/** Converts the fake response to the Express type expected by the handlers. */
export const asResponse = (res: FakeResponse): Response => res as unknown as Response
