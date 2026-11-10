import { referentialRouter } from './factory.js'

// L'intitulé saisi sur le CV (cv_certification.title) est conservé tel quel : seul le lien change.
const moveReferences = async (client, sourceId, targetId) => {
  await client.query(
    'UPDATE cv_certification SET certification_id = $2 WHERE certification_id = $1',
    [sourceId, targetId],
  )
}

export default referentialRouter({
  table: 'certification',
  columns: ['id', 'name', 'organization', 'merged_into_id', 'active', 'created_at', 'updated_at'],
  fields: {
    name: { type: 'name', required: true },
    organization: { type: 'text' },
    active: { type: 'boolean' },
  },
  orderBy: (alias) => `lower(${alias}name), lower(coalesce(${alias}organization, ''))`,
  searchColumns: ['name', 'organization'],
  moveReferences,
})
