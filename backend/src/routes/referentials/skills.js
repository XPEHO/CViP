import { query } from '../../db/index.js'
import { HttpError } from '../../lib/http-error.js'
import { parseBody } from '../../lib/validate.js'
import { referentialRouter } from './factory.js'

const columns = ['id', 'name', 'kind', 'category', 'merged_into_id', 'active', 'created_at', 'updated_at']

const fields = {
  name: { type: 'name', required: true },
  kind: { type: 'enum', values: ['technical', 'functional'] },
  category: { type: 'text' },
  active: { type: 'boolean' },
}

const select = columns.map((column) => `c.${column}`).join(', ')

// Élément canonique correspondant à un nom (nom propre ou nom d'un élément fusionné).
const findCanonicalByName = async (name) => {
  const { rows } = await query(
    `SELECT ${select} FROM skill s
     JOIN skill c ON c.id = coalesce(s.merged_into_id, s.id)
     WHERE lower(s.name) = lower($1)`,
    [name],
  )
  return rows[0]
}

const moveReferences = async (client, sourceId, targetId) => {
  // CV portant les deux compétences : on garde une seule ligne, avec le meilleur niveau,
  // le plus grand nombre d'années et la meilleure position.
  await client.query(
    `UPDATE cv_skill t SET
       level_id = (SELECT l.id FROM skill_level l WHERE l.id IN (t.level_id, s.level_id) ORDER BY l.rank DESC LIMIT 1),
       years = greatest(t.years, s.years),
       position = least(t.position, s.position)
     FROM cv_skill s
     WHERE t.skill_id = $2 AND s.skill_id = $1 AND s.cv_id = t.cv_id`,
    [sourceId, targetId],
  )
  await client.query(
    `DELETE FROM cv_skill s USING cv_skill t
     WHERE s.skill_id = $1 AND t.skill_id = $2 AND t.cv_id = s.cv_id`,
    [sourceId, targetId],
  )
  await client.query('UPDATE cv_skill SET skill_id = $2 WHERE skill_id = $1', [sourceId, targetId])

  await client.query(
    `DELETE FROM cv_experience_skill s USING cv_experience_skill t
     WHERE s.skill_id = $1 AND t.skill_id = $2 AND t.experience_id = s.experience_id`,
    [sourceId, targetId],
  )
  await client.query('UPDATE cv_experience_skill SET skill_id = $2 WHERE skill_id = $1', [sourceId, targetId])
}

// Saisie libre normalisée depuis le CV : renvoie la compétence existante (200) ou la crée (201).
// Un nom fusionné renvoie l'élément canonique ; un élément désactivé n'est pas réutilisable.
const extend = (router) => {
  router.post('/resolve', async (req, res) => {
    const { name } = parseBody(req.body, { name: fields.name })

    let skill = await findCanonicalByName(name)
    if (!skill) {
      const { rows } = await query(
        `INSERT INTO skill (name) VALUES ($1)
         ON CONFLICT ((lower(name))) DO NOTHING
         RETURNING ${columns.join(', ')}`,
        [name],
      )
      if (rows.length > 0) return res.status(201).json(rows[0])
      // Créée entre-temps par une requête concurrente.
      skill = await findCanonicalByName(name)
    }
    if (!skill.active) throw new HttpError(409, `La compétence « ${skill.name} » est désactivée`)
    res.json(skill)
  })
}

export default referentialRouter({
  table: 'skill',
  columns,
  fields,
  orderBy: (alias) => `lower(${alias}name)`,
  searchColumns: ['name'],
  moveReferences,
  extend,
})
