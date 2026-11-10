import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { pool } from '../src/db/index.js'

// Chaque test s'exécute dans une transaction annulée à la fin.
let client

before(async () => {
  client = await pool.connect()
})

after(async () => {
  client.release()
  await pool.end()
})

const inTransaction = (fn) => async () => {
  await client.query('BEGIN')
  try {
    await fn()
  } finally {
    await client.query('ROLLBACK')
  }
}

const createCv = async () => {
  const { rows: [consultant] } = await client.query(
    `INSERT INTO consultant (first_name, last_name, email)
     VALUES ('Ada', 'Lovelace', 'ada@example.com') RETURNING id`,
  )
  const { rows: [cv] } = await client.query(
    `INSERT INTO master_cv (consultant_id, job_title_fr, summary_fr)
     VALUES ($1, 'Développeuse', '**Experte** :\n- Vue\n- Node') RETURNING id, updated_at`,
    [consultant.id],
  )
  return cv
}

test('un CV maître complet peut être saisi', inTransaction(async () => {
  const cv = await createCv()
  const { rows: [skill] } = await client.query(`INSERT INTO skill (name) VALUES ('Vue.js') RETURNING id`)
  const { rows: [level] } = await client.query(`SELECT id FROM skill_level WHERE label_fr = 'Expert'`)
  const { rows: [sector] } = await client.query(`INSERT INTO sector (name_fr) VALUES ('Banque') RETURNING id`)

  await client.query('INSERT INTO cv_skill (cv_id, skill_id, level_id, years) VALUES ($1, $2, $3, 5)', [cv.id, skill.id, level.id])
  await client.query('INSERT INTO cv_sector (cv_id, sector_id) VALUES ($1, $2)', [cv.id, sector.id])
  await client.query(`INSERT INTO cv_language (cv_id, language_code, level) VALUES ($1, 'en', 'C1')`, [cv.id])
  await client.query(`INSERT INTO cv_education (cv_id, degree_fr, school, year) VALUES ($1, 'Master', 'INSA', 2015)`, [cv.id])
  await client.query(`INSERT INTO cv_training (cv_id, title) VALUES ($1, 'Clean Code')`, [cv.id])
  await client.query(
    `INSERT INTO cv_certification (cv_id, title, obtained_on, expires_on) VALUES ($1, 'AWS SAA', '2022-01-01', '2025-01-01')`,
    [cv.id],
  )
  const { rows: [xp] } = await client.query(
    `INSERT INTO cv_experience (cv_id, company, title_fr, start_date, description_fr, sector_id)
     VALUES ($1, 'Client', 'Lead dev', '2020-01-01', '- Refonte du front', $2) RETURNING id`,
    [cv.id, sector.id],
  )
  await client.query('INSERT INTO cv_experience_skill (experience_id, skill_id) VALUES ($1, $2)', [xp.id, skill.id])

  const { rows } = await client.query(
    `SELECT c.last_name FROM consultant c
     JOIN master_cv m ON m.consultant_id = c.id
     JOIN cv_skill s ON s.cv_id = m.id
     WHERE s.skill_id = $1`,
    [skill.id],
  )
  assert.deepEqual(rows, [{ last_name: 'Lovelace' }])
}))

test('le HTML est refusé dans les textes Markdown', inTransaction(async () => {
  const cv = await createCv()
  await assert.rejects(
    client.query(`UPDATE master_cv SET summary_fr = '<script>alert(1)</script>' WHERE id = $1`, [cv.id]),
    { code: '23514' },
  )
}))

test('un consultant n\'a qu\'un seul CV maître', inTransaction(async () => {
  await createCv()
  await assert.rejects(
    client.query(`INSERT INTO master_cv (consultant_id) SELECT id FROM consultant WHERE email = 'ada@example.com'`),
    { code: '23505' },
  )
}))

test('les doublons du référentiel de compétences sont refusés sans tenir compte de la casse', inTransaction(async () => {
  await client.query(`INSERT INTO skill (name) VALUES ('React')`)
  await assert.rejects(client.query(`INSERT INTO skill (name) VALUES ('react')`), { code: '23505' })
}))

test('modifier une rubrique met à jour la date du CV maître', inTransaction(async () => {
  const cv = await createCv()
  // now() est figé dans une transaction : on recule la date pour observer le changement,
  // en désactivant le trigger qui la remettrait à now().
  await client.query('ALTER TABLE master_cv DISABLE TRIGGER master_cv_set_updated_at')
  await client.query(`UPDATE master_cv SET updated_at = '2000-01-01' WHERE id = $1`, [cv.id])
  await client.query('ALTER TABLE master_cv ENABLE TRIGGER master_cv_set_updated_at')

  await client.query(`INSERT INTO cv_language (cv_id, language_code, level) VALUES ($1, 'de', 'B1')`, [cv.id])

  const { rows: [{ updated_at }] } = await client.query('SELECT updated_at FROM master_cv WHERE id = $1', [cv.id])
  assert.ok(updated_at > new Date('2000-01-02'))
}))
