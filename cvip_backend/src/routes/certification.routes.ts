/** Certification routes (`/certifications`): wires the repository, service and controller. */
import { createCertificationController } from '../controllers/certification.controller.ts'
import { AppDataSource } from '../db/data-source.ts'
import { createCertificationRepository } from '../repositories/certification.repository.ts'
import { createMergeableReferentialService } from '../services/referential.service.ts'
import { createReferentialRouter } from './referential.routes.ts'

/** Certification router. */
export const certificationRouter = createReferentialRouter(
  createCertificationController(
    createMergeableReferentialService(createCertificationRepository(AppDataSource)),
  ),
)
