/** Entity of a level of the skill scale. */
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/** Level of the skill scale (table `skill_level`), ordered by `rank`. */
@Entity({ name: 'skill_level' })
export class SkillLevel {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'label_fr', type: 'text' })
  labelFr!: string

  @Column({ name: 'label_en', type: 'text', nullable: true })
  labelEn!: string | null

  @Column({ type: 'smallint' })
  rank!: number

  @Column({ type: 'boolean' })
  active!: boolean
}
