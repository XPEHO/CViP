/** Entity of a technical or functional skill of the referential. */
import { Column, Entity } from 'typeorm'
import { MergeableReferential } from './MergeableReferential.ts'

/** Values of the PostgreSQL enumeration `skill_kind`. */
export const SKILL_KINDS = ['technical', 'functional'] as const

/** Kind of a skill. */
export type SkillKind = (typeof SKILL_KINDS)[number]

/** Skill of the referential (table `skill`). */
@Entity({ name: 'skill' })
export class Skill extends MergeableReferential {
  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'enum', enum: SKILL_KINDS, enumName: 'skill_kind' })
  kind!: SkillKind

  @Column({ type: 'text', nullable: true })
  category!: string | null
}
