/** Entity of a certification of the referential. */
import { Column, Entity } from 'typeorm'
import { MergeableReferential } from './MergeableReferential.ts'

/** Certification (table `certification`), identified by its name and its organization. */
@Entity({ name: 'certification' })
export class Certification extends MergeableReferential {
  @Column({ type: 'text' })
  name!: string

  @Column({ type: 'text', nullable: true })
  organization!: string | null
}
