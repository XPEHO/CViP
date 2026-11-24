/** Skill routes (`/skills`): wires the repository, service and controller. */
import { createSkillController } from '../controllers/skill.controller.ts'
import { AppDataSource } from '../db/data-source.ts'
import { createSkillRepository } from '../repositories/skill.repository.ts'
import { createSkillService } from '../services/skill.service.ts'
import { createReferentialRouter } from './referential.routes.ts'

const controller = createSkillController(createSkillService(createSkillRepository(AppDataSource)))

/** Skill router. */
export const skillRouter = createReferentialRouter(controller, (router) => {
  router.post('/resolve', controller.handleResolveSkill)
})
