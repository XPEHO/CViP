/** Controller of the business sectors. */
import type { Sector } from '../entities/Sector.ts'
import type { MergeableReferentialService } from '../services/referential.service.ts'
import type { FieldSpecs } from '../utils/validation.ts'
import { createMergeableReferentialController } from './referential.controller.ts'
import type { MergeableReferentialController } from './referential.controller.ts'

/** Fields of the JSON body of a sector. */
export const SECTOR_FIELDS = {
  name_fr: { type: 'name', required: true },
  name_en: { type: 'text' },
  active: { type: 'boolean' },
} satisfies FieldSpecs

/** Creates the HTTP handlers of the sectors. */
export const createSectorController = (
  service: MergeableReferentialService<Sector>,
): MergeableReferentialController =>
  createMergeableReferentialController(service, { domain: 'SECTOR', fields: SECTOR_FIELDS })
