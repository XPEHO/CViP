import { withTransaction } from '../../db/index.js'
import { HttpError } from '../../lib/http-error.js'
import { parseUuid } from '../../lib/validate.js'
import { referentialRouter } from './factory.js'

const columns = ['id', 'label_fr', 'label_en', 'rank', 'active']

// Réordonne les niveaux donnés : ils se répartissent, dans l'ordre fourni, les rangs qu'ils
// occupent déjà. Les autres niveaux ne bougent pas.
const extend = (router) => {
  router.put('/order', async (req, res) => {
    const ids = req.body?.ids
    if (!Array.isArray(ids) || ids.length === 0) throw new HttpError(400, 'ids doit être une liste non vide')
    const levelIds = ids.map((id) => parseUuid(id, 'ids'))
    if (new Set(levelIds).size !== levelIds.length) throw new HttpError(400, 'ids contient des doublons')

    const levels = await withTransaction(async (client) => {
      const { rows } = await client.query('SELECT rank FROM skill_level WHERE id = ANY($1) FOR UPDATE', [levelIds])
      if (rows.length !== levelIds.length) throw new HttpError(404, 'Niveau introuvable')

      const ranks = rows.map((row) => row.rank).sort((a, b) => a - b)
      // Unicité du rang vérifiée en fin d'instruction (contrainte DEFERRABLE) : les échanges passent.
      await client.query(
        `UPDATE skill_level l SET rank = v.rank
         FROM unnest($1::uuid[], $2::smallint[]) AS v(id, rank)
         WHERE l.id = v.id`,
        [levelIds, ranks],
      )
      const result = await client.query(`SELECT ${columns.join(', ')} FROM skill_level ORDER BY rank`)
      return result.rows
    })
    res.json(levels)
  })
}

export default referentialRouter({
  table: 'skill_level',
  columns,
  fields: {
    label_fr: { type: 'name', required: true },
    label_en: { type: 'text' },
    rank: { type: 'rank', required: true },
    active: { type: 'boolean' },
  },
  orderBy: (alias) => `${alias}rank`,
  searchColumns: ['label_fr', 'label_en'],
  extend,
})
