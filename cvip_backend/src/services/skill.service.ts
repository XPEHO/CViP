/** Skill service: common operations and resolution of a free-text entry. */
import type { Skill } from '../entities/Skill.ts'
import type { SkillRepository } from '../repositories/skill.repository.ts'
import { ReferentialNotFoundError, SkillDisabledError } from './referential.errors.ts'
import { createMergeableReferentialService } from './referential.service.ts'
import type { MergeableReferentialService } from './referential.service.ts'

/** Skill service. */
export interface SkillService extends MergeableReferentialService<Skill> {
  /** Returns the existing skill or creates it; `created` is `true` for a creation. */
  resolve: (name: string) => Promise<{ skill: Skill; created: boolean }>
}

/** Creates the skill service. */
export const createSkillService = (repository: SkillRepository): SkillService => ({
  ...createMergeableReferentialService(repository),

  // A merged name returns the canonical item; a disabled item cannot be reused.
  resolve: async (name) => {
    let skill = await repository.findCanonicalByName(name)
    if (!skill) {
      const created = await repository.insertIfAbsent(name)
      if (created) return { skill: created, created: true }
      // Created in the meantime by a concurrent request.
      skill = await repository.findCanonicalByName(name)
    }
    if (!skill) throw new ReferentialNotFoundError()
    if (!skill.active) throw new SkillDisabledError(skill.name)
    return { skill, created: false }
  },
})
