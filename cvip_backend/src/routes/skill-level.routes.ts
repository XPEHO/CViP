/** Scale level routes (`/skill-levels`): wires the repository, service and controller. */
import { createSkillLevelController } from '../controllers/skill-level.controller.ts'
import { AppDataSource } from '../db/data-source.ts'
import { createSkillLevelRepository } from '../repositories/skill-level.repository.ts'
import { createSkillLevelService } from '../services/skill-level.service.ts'
import { createReferentialRouter } from './referential.routes.ts'

const controller = createSkillLevelController(
  createSkillLevelService(createSkillLevelRepository(AppDataSource)),
)

/** Level router. */
export const skillLevelRouter = createReferentialRouter(controller, (router) => {
  router.put('/order', controller.handleReorderSkillLevels)
})
