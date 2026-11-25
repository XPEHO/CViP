/** Controller of the certifications. */
import type { Certification } from '../entities/Certification.ts'
import type { MergeableReferentialService } from '../services/referential.service.ts'
import type { FieldSpecs } from '../utils/validation.ts'
import { createMergeableReferentialController } from './referential.controller.ts'
import type { MergeableReferentialController } from './referential.controller.ts'

/** Fields of the JSON body of a certification. */
export const CERTIFICATION_FIELDS = {
  name: { type: 'name', required: true },
  organization: { type: 'text' },
  active: { type: 'boolean' },
} satisfies FieldSpecs

/** Creates the HTTP handlers of the certifications. */
export const createCertificationController = (
  service: MergeableReferentialService<Certification>,
): MergeableReferentialController =>
  createMergeableReferentialController(service, {
    domain: 'CERTIFICATION',
    fields: CERTIFICATION_FIELDS,
  })
