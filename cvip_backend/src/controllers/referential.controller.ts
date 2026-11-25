/** HTTP controllers shared by the referentials: read the request, call the service, respond. */
import type { Request, RequestHandler, Response } from 'express'
import {
  getBody,
  getId,
  getListQuery,
  getMergeTarget,
  getSuggestQuery,
  toResponse,
} from '../mappers/http.mapper.ts'
import type { ReferentialRow } from '../repositories/referential.repository.ts'
import {
  ReferentialAlreadyMergedError,
  ReferentialDuplicateError,
  ReferentialMergedError,
  ReferentialNotFoundError,
  ReferentialTargetInactiveError,
  ReferentialTargetMergedError,
  SkillDisabledError,
} from '../services/referential.errors.ts'
import type {
  MergeableReferentialService,
  ReferentialService,
} from '../services/referential.service.ts'
import { sendError } from '../utils/api-error.ts'
import type { ErrorCode, ReferentialDomain } from '../utils/api-error.ts'
import type { FieldSpecs } from '../utils/validation.ts'

/** Handlers of the operations shared by all referentials. */
export interface ReferentialController {
  handleListReferential: RequestHandler
  handleGetReferential: RequestHandler
  handleCreateReferential: RequestHandler
  handleUpdateReferential: RequestHandler
}

/** Additional handlers of the mergeable referentials. */
export interface MergeableReferentialController extends ReferentialController {
  handleSuggestReferential: RequestHandler
  handleMergeReferential: RequestHandler
}

/** Context of a referential: its error domain and the fields of its JSON body. */
export interface ReferentialControllerOptions {
  domain: ReferentialDomain
  fields: FieldSpecs
}

/** API code of a referential business error, or `undefined` if the error is of another type. */
export const toReferentialCode = (
  domain: ReferentialDomain,
  err: unknown,
): ErrorCode | undefined => {
  if (err instanceof SkillDisabledError) return 'SKILL_DISABLED'
  if (err instanceof ReferentialNotFoundError) return `${domain}_NOT_FOUND`
  if (err instanceof ReferentialDuplicateError) return `${domain}_DUPLICATE`
  // Skill levels are never merged: their services never throw these four errors.
  if (err instanceof ReferentialMergedError) return `${domain}_MERGED` as ErrorCode
  if (err instanceof ReferentialAlreadyMergedError) return `${domain}_ALREADY_MERGED` as ErrorCode
  if (err instanceof ReferentialTargetMergedError) return `${domain}_TARGET_MERGED` as ErrorCode
  if (err instanceof ReferentialTargetInactiveError) return `${domain}_TARGET_INACTIVE` as ErrorCode
  return undefined
}

/** Translates a business error into a response; rethrows any other error to the global handler. */
export const withReferentialErrors =
  (
    domain: ReferentialDomain,
    handler: (req: Request, res: Response) => Promise<void>,
  ): RequestHandler =>
  async (req, res) => {
    try {
      await handler(req, res)
    } catch (err) {
      const code = toReferentialCode(domain, err)
      if (!code || !(err instanceof Error)) throw err
      sendError(res, code, err.message)
    }
  }

/** Creates the HTTP handlers of the common operations. */
export const createReferentialController = <E extends ReferentialRow>(
  service: ReferentialService<E>,
  { domain, fields }: ReferentialControllerOptions,
): ReferentialController => ({
  handleListReferential: withReferentialErrors(domain, async (req, res) => {
    res.json((await service.list(getListQuery(req))).map(toResponse))
  }),

  handleGetReferential: withReferentialErrors(domain, async (req, res) => {
    res.json(toResponse(await service.get(getId(req))))
  }),

  handleCreateReferential: withReferentialErrors(domain, async (req, res) => {
    const created = await service.create(getBody(req, fields) as never)
    res.status(201).json(toResponse(created))
  }),

  handleUpdateReferential: withReferentialErrors(domain, async (req, res) => {
    const id = getId(req)
    const values = getBody(req, fields, { partial: true })
    res.json(toResponse(await service.update(id, values as never)))
  }),
})

/** Creates the HTTP handlers of the mergeable referentials. */
export const createMergeableReferentialController = <E extends ReferentialRow>(
  service: MergeableReferentialService<E>,
  options: ReferentialControllerOptions,
): MergeableReferentialController => ({
  ...createReferentialController(service, options),

  handleSuggestReferential: withReferentialErrors(options.domain, async (req, res) => {
    const { q, limit } = getSuggestQuery(req)
    res.json((await service.suggest(q, limit)).map(toResponse))
  }),

  handleMergeReferential: withReferentialErrors(options.domain, async (req, res) => {
    const sourceId = getId(req)
    const merged = await service.merge(sourceId, getMergeTarget(req, sourceId))
    res.json(toResponse(merged))
  }),
})
