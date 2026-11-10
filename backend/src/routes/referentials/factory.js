import { Router } from 'express'
import { pool, query, withTransaction } from '../../db/index.js'
import { HttpError } from '../../lib/http-error.js'
import {
  escapeLike,
  parseBody,
  parseQueryBoolean,
  parseQueryLimit,
  parseQueryString,
  parseUuid,
} from '../../lib/validate.js'

/**
 * Router CRUD commun aux référentiels.
 *
 * config :
 *  - table, columns (colonnes renvoyées), fields (champs modifiables, voir parseBody)
 *  - orderBy(alias) : clause de tri des listes, colonnes préfixées par alias ('' ou 'c.')
 *  - searchColumns : colonnes interrogées par ?q= et par l'autocomplétion
 *  - moveReferences(client, sourceId, targetId) : si présent, active la fusion de doublons ;
 *    reporte sur l'élément cible les usages de l'élément fusionné.
 *  - extend(router) : routes spécifiques, déclarées avant /:id
 *
 * Les éléments ne sont jamais supprimés : ils sont désactivés ou fusionnés, ce qui préserve
 * les CV qui les utilisent.
 */
export const referentialRouter = (config) => {
  const { table, columns, fields, orderBy, searchColumns, moveReferences, extend } = config
  const mergeable = Boolean(moveReferences)
  const select = columns.join(', ')
  const router = Router()

  const findById = async (id, db = pool) => {
    const { rows } = await db.query(`SELECT ${select} FROM ${table} WHERE id = $1`, [id])
    return rows[0]
  }

  const searchClause = (alias, paramIndex) => {
    const conditions = searchColumns.map((column) => `${alias}${column} ILIKE $${paramIndex}`)
    return `(${conditions.join(' OR ')})`
  }

  extend?.(router)

  // Autocomplétion de la saisie du CV : éléments actifs uniquement. Le nom d'un élément fusionné
  // reste reconnu et renvoie l'élément canonique (« ReactJS » propose « React »).
  if (mergeable) {
    router.get('/suggest', async (req, res) => {
      const q = parseQueryString(req.query.q, 'q')?.trim() ?? ''
      const limit = parseQueryLimit(req.query.limit, { fallback: 10, max: 50 })
      if (q === '') return res.json([])

      const canonicalColumns = columns.map((column) => `c.${column}`).join(', ')
      const prefixMatch = searchColumns.map((column) => `s.${column} ILIKE $2`).join(' OR ')
      const { rows } = await query(
        `SELECT ${canonicalColumns}
         FROM ${table} s
         JOIN ${table} c ON c.id = coalesce(s.merged_into_id, s.id)
         WHERE c.active AND c.merged_into_id IS NULL AND ${searchClause('s.', 1)}
         GROUP BY c.id
         ORDER BY min(CASE WHEN ${prefixMatch} THEN 0 ELSE 1 END), ${orderBy('c.')}
         LIMIT $3`,
        [`%${escapeLike(q)}%`, `${escapeLike(q)}%`, limit],
      )
      res.json(rows)
    })
  }

  router.get('/', async (req, res) => {
    const q = parseQueryString(req.query.q, 'q')?.trim()
    const active = parseQueryBoolean(req.query.active, 'active')
    const includeMerged = parseQueryBoolean(req.query.include_merged, 'include_merged')

    const where = []
    const params = []
    if (q) {
      params.push(`%${escapeLike(q)}%`)
      where.push(searchClause('', params.length))
    }
    if (active !== undefined) {
      params.push(active)
      where.push(`active = $${params.length}`)
    }
    if (mergeable && !includeMerged) where.push('merged_into_id IS NULL')

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : ''
    const { rows } = await query(
      `SELECT ${select} FROM ${table} ${whereClause} ORDER BY ${orderBy('')}`,
      params,
    )
    res.json(rows)
  })

  router.get('/:id', async (req, res) => {
    const item = await findById(parseUuid(req.params.id))
    if (!item) throw new HttpError(404, 'Élément introuvable')
    res.json(item)
  })

  router.post('/', async (req, res) => {
    const values = parseBody(req.body, fields)
    const keys = Object.keys(values)
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ')
    const { rows } = await query(
      `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${select}`,
      keys.map((key) => values[key]),
    )
    res.status(201).json(rows[0])
  })

  router.patch('/:id', async (req, res) => {
    const id = parseUuid(req.params.id)
    const values = parseBody(req.body, fields, { partial: true })
    const keys = Object.keys(values)
    const assignments = keys.map((key, i) => `${key} = $${i + 2}`).join(', ')
    const notMerged = mergeable ? 'AND merged_into_id IS NULL' : ''
    const { rows } = await query(
      `UPDATE ${table} SET ${assignments} WHERE id = $1 ${notMerged} RETURNING ${select}`,
      [id, ...keys.map((key) => values[key])],
    )
    if (rows.length > 0) return res.json(rows[0])

    if (await findById(id)) throw new HttpError(409, 'Élément fusionné : modifiez l\'élément dans lequel il a été fusionné')
    throw new HttpError(404, 'Élément introuvable')
  })

  // Fusionne l'élément :id dans target_id : ses usages sont reportés sur la cible,
  // puis il est désactivé et pointe vers elle.
  if (mergeable) {
    router.post('/:id/merge', async (req, res) => {
      const sourceId = parseUuid(req.params.id)
      const { target_id: rawTargetId, ...rest } = req.body ?? {}
      const unknown = Object.keys(rest)
      if (unknown.length > 0) throw new HttpError(400, `Champ(s) inconnu(s) : ${unknown.join(', ')}`)
      const targetId = parseUuid(rawTargetId, 'target_id')
      if (sourceId === targetId) throw new HttpError(400, 'Un élément ne peut pas être fusionné avec lui-même')

      const target = await withTransaction(async (client) => {
        const { rows } = await client.query(
          `SELECT id, active, merged_into_id FROM ${table} WHERE id = ANY($1) ORDER BY id FOR UPDATE`,
          [[sourceId, targetId]],
        )
        const source = rows.find((row) => row.id === sourceId)
        const destination = rows.find((row) => row.id === targetId)
        if (!source || !destination) throw new HttpError(404, 'Élément introuvable')
        if (source.merged_into_id) throw new HttpError(409, 'Cet élément a déjà été fusionné')
        if (destination.merged_into_id) throw new HttpError(409, 'L\'élément cible a lui-même été fusionné')
        if (!destination.active) throw new HttpError(409, 'L\'élément cible est désactivé')

        await moveReferences(client, sourceId, targetId)
        // Pas de chaîne de fusion : les éléments déjà fusionnés dans la source pointent vers la cible.
        await client.query(`UPDATE ${table} SET merged_into_id = $2 WHERE merged_into_id = $1`, [sourceId, targetId])
        await client.query(`UPDATE ${table} SET merged_into_id = $2, active = false WHERE id = $1`, [sourceId, targetId])
        return findById(targetId, client)
      })
      res.json(target)
    })
  }

  return router
}
