/** Controller of the skills: common operations and resolution of a free-text entry. */
import type { RequestHandler } from 'express'
import { SKILL_KINDS } from '../entities/Skill.ts'
import type { Skill } from '../entities/Skill.ts'
import { getBody, toResponse } from '../mappers/http.mapper.ts'
import type { SkillService } from '../services/skill.service.ts'
import type { FieldSpecs } from '../utils/validation.ts'
import {
  createMergeableReferentialController,
  withReferentialErrors,
} from './referential.controller.ts'
import type { MergeableReferentialController } from './referential.controller.ts'

/** Fields of the JSON body of a skill. */
export const SKILL_FIELDS = {
  name: { type: 'name', required: true },
  kind: { type: 'enum', values: SKILL_KINDS },
  category: { type: 'text' },
  active: { type: 'boolean' },
} satisfies FieldSpecs

/** HTTP handlers of the skills. */
export interface SkillController extends MergeableReferentialController {
  handleResolveSkill: RequestHandler
}

/** Creates the HTTP handlers of the skills. */
export const createSkillController = (service: SkillService): SkillController => ({
  ...createMergeableReferentialController<Skill>(service, {
    domain: 'SKILL',
    fields: SKILL_FIELDS,
  }),

  /** Free-text entry from a CV: returns the existing skill (200) or creates it (201). */
  handleResolveSkill: withReferentialErrors('SKILL', async (req, res) => {
    const { name } = getBody(req, { name: SKILL_FIELDS.name }) as { name: string }
    const { skill, created } = await service.resolve(name)
    res.status(created ? 201 : 200).json(toResponse(skill))
  }),
})
