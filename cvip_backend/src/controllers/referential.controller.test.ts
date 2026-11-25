import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import type { NextFunction } from 'express'
import { ReferentialTargetInactiveError } from '../services/referential.errors.ts'
import type { MergeableReferentialService } from '../services/referential.service.ts'
import { asResponse, fakeReq, fakeRes } from '../test-utils/http.ts'
import { ApiError } from '../utils/api-error.ts'
import {
  createMergeableReferentialController,
  withReferentialErrors,
} from './referential.controller.ts'

type Row = { id: string; active: boolean; mergedIntoId: string | null; nameFr: string }
const item: Row = { id: 'a', active: true, mergedIntoId: null, nameFr: 'Banque' }
const next: NextFunction = () => {}

const fakeService = (overrides: Partial<MergeableReferentialService<Row>> = {}) =>
  ({
    list: async () => [item],
    get: async () => item,
    create: async (values: unknown) => ({ ...item, ...(values as object) }),
    update: async () => item,
    suggest: async () => [item],
    merge: async () => item,
    ...overrides,
  }) as MergeableReferentialService<Row>

const options = { domain: 'SECTOR', fields: { name_fr: { type: 'name', required: true } } } as const

test('une erreur métier devient <DOMAINE>_<NATURE> avec le statut associé', async () => {
  const handler = withReferentialErrors('SECTOR', async () => {
    throw new ReferentialTargetInactiveError()
  })
  const res = fakeRes()
  await handler(fakeReq(), asResponse(res), next)
  assert.equal(res.statusCode, 409)
  assert.deepEqual(res.body, {
    code: 'SECTOR_TARGET_INACTIVE',
    message: "L'élément cible est désactivé",
  })
})

test('une erreur qui n’est pas métier est relancée au gestionnaire global', async () => {
  const handler = withReferentialErrors('SECTOR', async () => {
    throw new ApiError('VALIDATION_ERROR', 'invalide')
  })
  await assert.rejects(async () => handler(fakeReq(), asResponse(fakeRes()), next), ApiError)
})

test('handleListReferential répond avec des clés snake_case', async () => {
  const controller = createMergeableReferentialController(fakeService(), options)
  const res = fakeRes()
  await controller.handleListReferential(fakeReq(), asResponse(res), next)
  assert.deepEqual(res.body, [{ id: 'a', active: true, merged_into_id: null, name_fr: 'Banque' }])
})

test('handleCreateReferential répond 201 avec l’élément créé', async () => {
  const controller = createMergeableReferentialController(fakeService(), options)
  const res = fakeRes()
  await controller.handleCreateReferential(
    fakeReq({ body: { name_fr: '  Assurance ' } }),
    asResponse(res),
    next,
  )
  assert.equal(res.statusCode, 201)
  assert.equal((res.body as Record<string, unknown>).name_fr, 'Assurance')
})

test('handleMergeReferential refuse une fusion avec soi-même avant d’appeler le service', async () => {
  const id = randomUUID()
  let called = false
  const controller = createMergeableReferentialController(
    fakeService({ merge: async () => ((called = true), item) }),
    options,
  )
  await assert.rejects(
    async () =>
      controller.handleMergeReferential(
        fakeReq({ params: { id }, body: { target_id: id } }),
        asResponse(fakeRes()),
        next,
      ),
    ApiError,
  )
  assert.equal(called, false)
})
