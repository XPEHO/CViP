/** Business sector routes (`/sectors`): wires the repository, service and controller. */
import { createSectorController } from '../controllers/sector.controller.ts'
import { AppDataSource } from '../db/data-source.ts'
import { createSectorRepository } from '../repositories/sector.repository.ts'
import { createMergeableReferentialService } from '../services/referential.service.ts'
import { createReferentialRouter } from './referential.routes.ts'

/** Sector router. */
export const sectorRouter = createReferentialRouter(
  createSectorController(createMergeableReferentialService(createSectorRepository(AppDataSource))),
)
