/** Scale level service: common operations and reordering. */
import type { SkillLevel } from '../entities/SkillLevel.ts'
import type { SkillLevelRepository } from '../repositories/skill-level.repository.ts'
import { ReferentialNotFoundError } from './referential.errors.ts'
import { createReferentialService } from './referential.service.ts'
import type { ReferentialService } from './referential.service.ts'

/** Level service. */
export interface SkillLevelService extends ReferentialService<SkillLevel> {
  /** Redistributes, in the order given, the ranks these levels already occupy. */
  reorder: (ids: string[]) => Promise<SkillLevel[]>
}

/** Creates the level service. */
export const createSkillLevelService = (repository: SkillLevelRepository): SkillLevelService => ({
  ...createReferentialService(repository),

  // The other levels do not move.
  reorder: async (ids) => {
    await repository.transaction(async (manager) => {
      const levels = await repository.lockByIds(ids, manager)
      if (levels.length !== ids.length) throw new ReferentialNotFoundError('Niveau introuvable')
      const ranks = levels.map((level) => level.rank).sort((a, b) => a - b)
      await repository.applyRanks(manager, ids, ranks)
    })
    return repository.list({})
  },
})
