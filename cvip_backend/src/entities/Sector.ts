/** Entity of a business sector of the referential. */
import { Column, Entity } from 'typeorm'
import { MergeableReferential } from './MergeableReferential.ts'

/** Business sector (table `sector`). */
@Entity({ name: 'sector' })
export class Sector extends MergeableReferential {
  @Column({ name: 'name_fr', type: 'text' })
  nameFr!: string

  @Column({ name: 'name_en', type: 'text', nullable: true })
  nameEn!: string | null
}
