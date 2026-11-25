/** Columns shared by the referentials whose duplicates can be merged. */
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm'

/** Base class: a merged item points to the canonical item and stays disabled. */
export abstract class MergeableReferential {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ name: 'merged_into_id', type: 'uuid', nullable: true })
  mergedIntoId!: string | null

  @Column({ type: 'boolean' })
  active!: boolean

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date
}
