import { referentialRouter } from './factory.js'

const moveReferences = async (client, sourceId, targetId) => {
  // CV portant les deux secteurs : on garde la cible, à la meilleure position.
  await client.query(
    `UPDATE cv_sector t SET position = least(t.position, s.position)
     FROM cv_sector s
     WHERE t.sector_id = $2 AND s.sector_id = $1 AND s.cv_id = t.cv_id`,
    [sourceId, targetId],
  )
  await client.query(
    `DELETE FROM cv_sector s USING cv_sector t
     WHERE s.sector_id = $1 AND t.sector_id = $2 AND t.cv_id = s.cv_id`,
    [sourceId, targetId],
  )
  await client.query('UPDATE cv_sector SET sector_id = $2 WHERE sector_id = $1', [sourceId, targetId])
  await client.query('UPDATE cv_experience SET sector_id = $2 WHERE sector_id = $1', [sourceId, targetId])
}

export default referentialRouter({
  table: 'sector',
  columns: ['id', 'name_fr', 'name_en', 'merged_into_id', 'active', 'created_at', 'updated_at'],
  fields: {
    name_fr: { type: 'name', required: true },
    name_en: { type: 'text' },
    active: { type: 'boolean' },
  },
  orderBy: (alias) => `lower(${alias}name_fr)`,
  searchColumns: ['name_fr', 'name_en'],
  moveReferences,
})
