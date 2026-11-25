import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Skill } from '../entities/Skill.ts'
import type { SkillRepository } from '../repositories/skill.repository.ts'
import { SkillDisabledError } from './referential.errors.ts'
import { createSkillService } from './skill.service.ts'

const skill = (name: string, active = true) => ({ id: name, name, active }) as unknown as Skill

/** Fake repository: `canonical` simulates the successive reads, `inserted` the result of the insertion. */
const fakeRepository = (canonical: (Skill | null)[], inserted: Skill | null = null) => {
  const reads = [...canonical]
  return {
    findCanonicalByName: async () => reads.shift() ?? null,
    insertIfAbsent: async () => inserted,
  } as unknown as SkillRepository
}

test('resolve renvoie la compétence existante sans la recréer', async () => {
  const service = createSkillService(fakeRepository([skill('React')]))
  const { skill: found, created } = await service.resolve('react')
  assert.equal(found.name, 'React')
  assert.equal(created, false)
})

test('resolve crée la compétence lorsque le nom est libre', async () => {
  const service = createSkillService(fakeRepository([null], skill('Kotlin')))
  const { skill: found, created } = await service.resolve('Kotlin')
  assert.equal(found.name, 'Kotlin')
  assert.equal(created, true)
})

test('resolve relit la compétence créée entre-temps par une requête concurrente', async () => {
  const service = createSkillService(fakeRepository([null, skill('Go')], null))
  const { skill: found, created } = await service.resolve('Go')
  assert.equal(found.name, 'Go')
  assert.equal(created, false)
})

test('resolve refuse une compétence désactivée', async () => {
  const service = createSkillService(fakeRepository([skill('Cobol', false)]))
  await assert.rejects(service.resolve('Cobol'), SkillDisabledError)
})
