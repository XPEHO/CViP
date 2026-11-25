/** TypeORM data source: the schema is managed only by the SQL migrations. */
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import type { EntityManager } from 'typeorm'
import { config } from '../config/env.ts'
import { Certification } from '../entities/Certification.ts'
import { Sector } from '../entities/Sector.ts'
import { Skill } from '../entities/Skill.ts'
import { SkillLevel } from '../entities/SkillLevel.ts'

/** Single PostgreSQL connection; `synchronize` stays `false`, the migrations are the source of truth. */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: config.databaseUrl,
  synchronize: false,
  logging: false,
  entities: [Skill, SkillLevel, Sector, Certification],
})

/** Runs `fn` in a transaction, committed if it succeeds and rolled back if it throws. */
export const withTransaction = <T>(fn: (manager: EntityManager) => Promise<T>): Promise<T> =>
  AppDataSource.transaction(fn)
