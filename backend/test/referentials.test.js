import { describe, test, after } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import request from 'supertest'
import app from '../src/app.js'
import { pool } from '../src/db/index.js'

// L'API utilise ses propres connexions : les données créées sont réelles. Elles portent toutes
// un tag propre à l'exécution et sont supprimées à la fin.
const tag = `t${randomUUID().slice(0, 8)}`
const api = request(app)

after(async () => {
  await pool.query('DELETE FROM consultant WHERE email LIKE $1', [`${tag}%`])
  await pool.query('DELETE FROM skill WHERE name LIKE $1', [`%${tag}%`])
  await pool.query('DELETE FROM sector WHERE name_fr LIKE $1', [`%${tag}%`])
  await pool.query('DELETE FROM certification WHERE name LIKE $1', [`%${tag}%`])
  await pool.query('DELETE FROM skill_level WHERE label_fr LIKE $1', [`%${tag}%`])
  await pool.end()
})

let cvCount = 0
const createCv = async () => {
  cvCount += 1
  const { rows: [consultant] } = await pool.query(
    `INSERT INTO consultant (first_name, last_name, email) VALUES ('Ada', 'Lovelace', $1) RETURNING id`,
    [`${tag}-${cvCount}@example.com`],
  )
  const { rows: [cv] } = await pool.query('INSERT INTO master_cv (consultant_id) VALUES ($1) RETURNING id', [consultant.id])
  return cv.id
}

const levelId = async (labelFr) => {
  const { rows: [level] } = await pool.query('SELECT id FROM skill_level WHERE label_fr = $1', [labelFr])
  return level.id
}

const post = async (path, body, expectedStatus = 201) => {
  const res = await api.post(path).send(body)
  assert.equal(res.status, expectedStatus, JSON.stringify(res.body))
  return res.body
}

describe('référentiel de compétences', () => {
  test('crée une compétence en normalisant les espaces', async () => {
    const skill = await post('/api/skills', { name: `  ${tag}   Vue  3 `, category: 'Front' })
    assert.equal(skill.name, `${tag} Vue 3`)
    assert.equal(skill.kind, 'technical')
    assert.equal(skill.category, 'Front')
    assert.equal(skill.active, true)
    assert.equal(skill.merged_into_id, null)

    const res = await api.get(`/api/skills/${skill.id}`)
    assert.equal(res.status, 200)
    assert.equal(res.body.name, skill.name)
  })

  test('refuse un doublon sans tenir compte de la casse', async () => {
    await post('/api/skills', { name: `${tag} Angular` })
    const res = await api.post('/api/skills').send({ name: `${tag} ANGULAR` })
    assert.equal(res.status, 409)
  })

  test('valide les entrées', async () => {
    const cases = [
      [() => api.post('/api/skills').send({}), 400],
      [() => api.post('/api/skills').send({ name: '   ' }), 400],
      [() => api.post('/api/skills').send({ name: `${tag} X`, kind: 'autre' }), 400],
      [() => api.post('/api/skills').send({ name: `${tag} X`, inconnu: 1 }), 400],
      [() => api.get('/api/skills/pas-un-uuid'), 400],
      [() => api.get(`/api/skills/${randomUUID()}`), 404],
      [() => api.patch(`/api/skills/${randomUUID()}`).send({ name: 'X' }), 404],
      [() => api.get('/api/skills?active=oui'), 400],
      [() => api.get('/api/skills/suggest?q=a&limit=500'), 400],
    ]
    for (const [send, status] of cases) {
      const res = await send()
      assert.equal(res.status, status, `${res.req.method} ${res.req.path}`)
      assert.equal(typeof res.body.error, 'string')
    }
  })

  test('modifie et désactive une compétence', async () => {
    const skill = await post('/api/skills', { name: `${tag} Cobol` })

    const renamed = await api.patch(`/api/skills/${skill.id}`).send({ name: `${tag} COBOL`, kind: 'functional' })
    assert.equal(renamed.status, 200)
    assert.equal(renamed.body.name, `${tag} COBOL`)
    assert.equal(renamed.body.kind, 'functional')

    const disabled = await api.patch(`/api/skills/${skill.id}`).send({ active: false })
    assert.equal(disabled.body.active, false)

    const inactive = await api.get(`/api/skills?active=false&q=${tag}`)
    assert.ok(inactive.body.some((item) => item.id === skill.id))
    const suggestions = await api.get(`/api/skills/suggest?q=${tag} COBOL`)
    assert.deepEqual(suggestions.body, [])
  })

  test('l\'autocomplétion propose d\'abord les noms qui commencent par la saisie', async () => {
    await post('/api/skills', { name: `${tag}-JavaScript` })
    await post('/api/skills', { name: `${tag}-Java` })
    await post('/api/skills', { name: `Core ${tag}-Java` })

    const res = await api.get(`/api/skills/suggest?q=${tag}-java`)
    assert.equal(res.status, 200)
    assert.deepEqual(res.body.map((item) => item.name), [`${tag}-Java`, `${tag}-JavaScript`, `Core ${tag}-Java`])

    const limited = await api.get(`/api/skills/suggest?q=${tag}-java&limit=1`)
    assert.equal(limited.body.length, 1)

    // Les caractères spéciaux de LIKE sont pris littéralement.
    const escaped = await api.get(`/api/skills/suggest?q=${encodeURIComponent(`${tag}%`)}`)
    assert.deepEqual(escaped.body, [])
    const empty = await api.get('/api/skills/suggest?q=')
    assert.deepEqual(empty.body, [])
  })

  test('fusionne un doublon en reportant ses usages sur les CV', async () => {
    const react = await post('/api/skills', { name: `${tag} React` })
    const reactJs = await post('/api/skills', { name: `${tag} ReactJS` })

    // CV 1 porte les deux compétences ; CV 2 seulement le doublon.
    const cv1 = await createCv()
    const cv2 = await createCv()
    await pool.query('INSERT INTO cv_skill (cv_id, skill_id, level_id, years, position) VALUES ($1, $2, $3, 4, 3)',
      [cv1, react.id, await levelId('Débutant')])
    await pool.query('INSERT INTO cv_skill (cv_id, skill_id, level_id, years, position) VALUES ($1, $2, $3, 2, 1)',
      [cv1, reactJs.id, await levelId('Expert')])
    await pool.query('INSERT INTO cv_skill (cv_id, skill_id) VALUES ($1, $2)', [cv2, reactJs.id])
    const { rows: [xp] } = await pool.query(
      `INSERT INTO cv_experience (cv_id, company, title_fr, start_date) VALUES ($1, 'Client', 'Dev', '2020-01-01') RETURNING id`,
      [cv1],
    )
    await pool.query('INSERT INTO cv_experience_skill (experience_id, skill_id) VALUES ($1, $2), ($1, $3)',
      [xp.id, react.id, reactJs.id])

    const merged = await post(`/api/skills/${reactJs.id}/merge`, { target_id: react.id }, 200)
    assert.equal(merged.id, react.id)

    const { rows: cvSkills } = await pool.query(
      `SELECT cs.cv_id, cs.skill_id, l.label_fr AS level, cs.years, cs.position
       FROM cv_skill cs LEFT JOIN skill_level l ON l.id = cs.level_id
       WHERE cs.cv_id = ANY($1) ORDER BY cs.cv_id = $2 DESC`,
      [[cv1, cv2], cv1],
    )
    assert.deepEqual(cvSkills, [
      { cv_id: cv1, skill_id: react.id, level: 'Expert', years: 4, position: 1 },
      { cv_id: cv2, skill_id: react.id, level: null, years: null, position: 0 },
    ])
    const { rows: xpSkills } = await pool.query('SELECT skill_id FROM cv_experience_skill WHERE experience_id = $1', [xp.id])
    assert.deepEqual(xpSkills, [{ skill_id: react.id }])

    const source = await api.get(`/api/skills/${reactJs.id}`)
    assert.equal(source.body.merged_into_id, react.id)
    assert.equal(source.body.active, false)

    // L'élément fusionné disparaît des listes, sauf demande explicite.
    const list = await api.get(`/api/skills?q=${tag} React`)
    assert.deepEqual(list.body.map((item) => item.id), [react.id])
    const withMerged = await api.get(`/api/skills?q=${tag} React&include_merged=true`)
    assert.equal(withMerged.body.length, 2)

    // Son nom reste reconnu par l'autocomplétion, qui propose l'élément canonique.
    const suggestions = await api.get(`/api/skills/suggest?q=${tag} ReactJS`)
    assert.deepEqual(suggestions.body.map((item) => item.id), [react.id])
  })

  test('refuse les fusions incohérentes', async () => {
    const a = await post('/api/skills', { name: `${tag} Merge A` })
    const b = await post('/api/skills', { name: `${tag} Merge B` })
    const c = await post('/api/skills', { name: `${tag} Merge C` })
    const off = await post('/api/skills', { name: `${tag} Merge Off`, active: false })

    assert.equal((await api.post(`/api/skills/${a.id}/merge`).send({ target_id: a.id })).status, 400)
    assert.equal((await api.post(`/api/skills/${a.id}/merge`).send({})).status, 400)
    assert.equal((await api.post(`/api/skills/${a.id}/merge`).send({ target_id: randomUUID() })).status, 404)
    assert.equal((await api.post(`/api/skills/${a.id}/merge`).send({ target_id: off.id })).status, 409)

    await post(`/api/skills/${a.id}/merge`, { target_id: b.id }, 200)
    assert.equal((await api.post(`/api/skills/${a.id}/merge`).send({ target_id: c.id })).status, 409)
    assert.equal((await api.post(`/api/skills/${c.id}/merge`).send({ target_id: a.id })).status, 409)
    assert.equal((await api.patch(`/api/skills/${a.id}`).send({ active: true })).status, 409)
  })

  test('aplatit les fusions successives', async () => {
    const a = await post('/api/skills', { name: `${tag} Chain A` })
    const b = await post('/api/skills', { name: `${tag} Chain B` })
    const c = await post('/api/skills', { name: `${tag} Chain C` })

    await post(`/api/skills/${a.id}/merge`, { target_id: b.id }, 200)
    await post(`/api/skills/${b.id}/merge`, { target_id: c.id }, 200)

    const res = await api.get(`/api/skills/${a.id}`)
    assert.equal(res.body.merged_into_id, c.id)
  })

  test('la saisie libre réutilise la compétence existante ou la crée', async () => {
    const created = await post('/api/skills/resolve', { name: `${tag}  Kotlin` }, 201)
    assert.equal(created.name, `${tag} Kotlin`)

    const existing = await post('/api/skills/resolve', { name: `${tag} kotlin` }, 200)
    assert.equal(existing.id, created.id)

    const alias = await post('/api/skills', { name: `${tag} Kotlin/JVM` })
    await post(`/api/skills/${alias.id}/merge`, { target_id: created.id }, 200)
    const canonical = await post('/api/skills/resolve', { name: `${tag} KOTLIN/JVM` }, 200)
    assert.equal(canonical.id, created.id)

    await api.patch(`/api/skills/${created.id}`).send({ active: false })
    assert.equal((await api.post('/api/skills/resolve').send({ name: `${tag} Kotlin` })).status, 409)
    assert.equal((await api.post('/api/skills/resolve').send({ name: '' })).status, 400)
  })
})

describe('référentiel de secteurs', () => {
  test('fusionne deux secteurs en conservant les CV et les expériences', async () => {
    const bank = await post('/api/sectors', { name_fr: `${tag} Banque`, name_en: 'Banking' })
    const finance = await post('/api/sectors', { name_fr: `${tag} Finance` })
    assert.equal(bank.name_en, 'Banking')

    const cv = await createCv()
    await pool.query('INSERT INTO cv_sector (cv_id, sector_id, position) VALUES ($1, $2, 2), ($1, $3, 0)',
      [cv, bank.id, finance.id])
    await pool.query(
      `INSERT INTO cv_experience (cv_id, company, title_fr, start_date, sector_id) VALUES ($1, 'Client', 'Dev', '2020-01-01', $2)`,
      [cv, finance.id],
    )

    await post(`/api/sectors/${finance.id}/merge`, { target_id: bank.id }, 200)

    const { rows: sectors } = await pool.query('SELECT sector_id, position FROM cv_sector WHERE cv_id = $1', [cv])
    assert.deepEqual(sectors, [{ sector_id: bank.id, position: 0 }])
    const { rows: [xp] } = await pool.query('SELECT sector_id FROM cv_experience WHERE cv_id = $1', [cv])
    assert.equal(xp.sector_id, bank.id)

    // Recherche sur le libellé anglais.
    const suggestions = await api.get('/api/sectors/suggest?q=bankin')
    assert.ok(suggestions.body.some((item) => item.id === bank.id))
  })
})

describe('référentiel de certifications', () => {
  test('distingue les homonymes d\'organismes différents et fusionne les doublons', async () => {
    const aws = await post('/api/certifications', { name: `${tag} Architect`, organization: 'AWS' })
    await post('/api/certifications', { name: `${tag} Architect`, organization: 'Azure' })
    assert.equal((await api.post('/api/certifications').send({ name: `${tag} architect`, organization: 'aws' })).status, 409)

    const duplicate = await post('/api/certifications', { name: `${tag} AWS Architect` })
    const cv = await createCv()
    await pool.query(`INSERT INTO cv_certification (cv_id, certification_id, title) VALUES ($1, $2, 'AWS SAA')`,
      [cv, duplicate.id])

    await post(`/api/certifications/${duplicate.id}/merge`, { target_id: aws.id }, 200)

    const { rows: [certification] } = await pool.query('SELECT certification_id, title FROM cv_certification WHERE cv_id = $1', [cv])
    assert.deepEqual(certification, { certification_id: aws.id, title: 'AWS SAA' })
  })
})

describe('échelle de niveaux', () => {
  test('propose une échelle de 1 à 5 par défaut', async () => {
    const res = await api.get('/api/skill-levels?active=true')
    assert.equal(res.status, 200)
    const defaults = res.body.filter((level) => level.rank <= 5)
    assert.deepEqual(defaults.map((level) => level.label_fr), ['Notions', 'Débutant', 'Intermédiaire', 'Confirmé', 'Expert'])
  })

  test('crée, modifie et réordonne des niveaux', async () => {
    // Rangs élevés et aléatoires pour ne pas toucher à l'échelle par défaut.
    const base = 1000 + Math.floor(Math.random() * 30000)
    const low = await post('/api/skill-levels', { label_fr: `${tag} Bas`, rank: base })
    const high = await post('/api/skill-levels', { label_fr: `${tag} Haut`, label_en: 'High', rank: base + 1 })

    assert.equal((await api.post('/api/skill-levels').send({ label_fr: `${tag} Zéro`, rank: 0 })).status, 400)
    assert.equal((await api.patch(`/api/skill-levels/${low.id}`).send({ rank: base + 1 })).status, 409)

    const order = await api.put('/api/skill-levels/order').send({ ids: [high.id, low.id] })
    assert.equal(order.status, 200)
    const ranks = Object.fromEntries(order.body.map((level) => [level.id, level.rank]))
    assert.deepEqual([ranks[high.id], ranks[low.id]], [base, base + 1])

    assert.equal((await api.put('/api/skill-levels/order').send({ ids: [] })).status, 400)
    assert.equal((await api.put('/api/skill-levels/order').send({ ids: [low.id, low.id] })).status, 400)
    assert.equal((await api.put('/api/skill-levels/order').send({ ids: [randomUUID()] })).status, 404)

    const disabled = await api.patch(`/api/skill-levels/${low.id}`).send({ active: false })
    assert.equal(disabled.body.active, false)
  })
})
