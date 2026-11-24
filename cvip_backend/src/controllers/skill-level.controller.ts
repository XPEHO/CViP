/** Controller of the scale levels: common operations and reordering. */
import type { RequestHandler } from 'express'
import type { SkillLevel } from '../entities/SkillLevel.ts'
import { getOrderIds, toResponse } from '../mappers/http.mapper.ts'
import type { SkillLevelService } from '../services/skill-level.service.ts'
import type { FieldSpecs } from '../utils/validation.ts'
import { createReferentialController, withReferentialErrors } from './referential.controller.ts'
import type { ReferentialController } from './referential.controller.ts'

/** Fields of the JSON body of a level. */
export const SKILL_LEVEL_FIELDS = {
  label_fr: { type: 'name', required: true },
  label_en: { type: 'text' },
  rank: { type: 'rank', required: true },
  active: { type: 'boolean' },
} satisfies FieldSpecs

/** HTTP handlers of the levels. */
export interface SkillLevelController extends ReferentialController {
  handleReorderSkillLevels: RequestHandler
}

/** Creates the HTTP handlers of the levels. */
export const createSkillLevelController = (service: SkillLevelService): SkillLevelController => ({
  ...createReferentialController<SkillLevel>(service, {
    domain: 'SKILL_LEVEL',
    fields: SKILL_LEVEL_FIELDS,
  }),

  handleReorderSkillLevels: withReferentialErrors('SKILL_LEVEL', async (req, res) => {
    res.json((await service.reorder(getOrderIds(req))).map(toResponse))
  }),
})
