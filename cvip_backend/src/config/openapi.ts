/** OpenAPI specification of the API, generated from the description of the referentials (generic router). */
import type { ReferentialDomain } from '../utils/api-error.ts'

/** OpenAPI specification fragment (any JSON object). */
type Json = Record<string, unknown>

/** Description of a referential, used to generate its paths. */
interface ReferentialDoc {
  path: string
  tag: string
  schema: string
  domain: ReferentialDomain
  mergeable: boolean
}

const REFERENTIALS: ReferentialDoc[] = [
  { path: '/skills', tag: 'Compétences', schema: 'Skill', domain: 'SKILL', mergeable: true },
  {
    path: '/skill-levels',
    tag: 'Niveaux',
    schema: 'SkillLevel',
    domain: 'SKILL_LEVEL',
    mergeable: false,
  },
  { path: '/sectors', tag: 'Secteurs', schema: 'Sector', domain: 'SECTOR', mergeable: true },
  {
    path: '/certifications',
    tag: 'Certifications',
    schema: 'Certification',
    domain: 'CERTIFICATION',
    mergeable: true,
  },
]

/** Reference to a schema of `components.schemas`. */
const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` })
/** JSON content of a request or response, described by `schema`. */
const json = (schema: Json): Json => ({ content: { 'application/json': { schema } } })
/** Schema of an array whose elements follow `items`. */
const array = (items: Json): Json => ({ type: 'array', items })
/** Path parameter `id` (UUID) shared by the routes of an item. */
const idParam: Json = {
  name: 'id',
  in: 'path',
  required: true,
  schema: { type: 'string', format: 'uuid' },
}
/** Optional query parameter. */
const query = (name: string, schema: Json, description: string): Json => ({
  name,
  in: 'query',
  required: false,
  schema,
  description,
})

/** Error response in the `{ code, message, details? }` format. */
const errorResponse = (description: string): Json => ({ description, ...json(ref('Error')) })
/** Shared 400 response for invalid input. */
const validation = errorResponse('Entrée invalide (`VALIDATION_ERROR`)')
/** 404 response of a domain (`<DOMAIN>_NOT_FOUND`). */
const notFound = (domain: ReferentialDomain): Json => errorResponse(`\`${domain}_NOT_FOUND\``)
/** 409 response listing the possible error codes. */
const conflict = (codes: string[]): Json => errorResponse(codes.map((c) => `\`${c}\``).join(', '))

/** OpenAPI paths of a referential: list, read, create, update, and merge when it exists. */
const referentialPaths = (doc: ReferentialDoc): Json => {
  const { path, tag, schema, domain, mergeable } = doc
  const tags = [tag]
  const paths: Json = {
    [path]: {
      get: {
        tags,
        summary: 'Liste',
        parameters: [
          query('q', { type: 'string' }, 'Recherche (insensible à la casse)'),
          query('active', { type: 'boolean' }, 'Filtre sur l’état actif'),
          ...(mergeable
            ? [query('include_merged', { type: 'boolean' }, 'Inclut les éléments fusionnés')]
            : []),
        ],
        responses: { 200: { description: 'Liste', ...json(array(ref(schema))) }, 400: validation },
      },
      post: {
        tags,
        summary: 'Création',
        requestBody: { required: true, ...json(ref(`${schema}Input`)) },
        responses: {
          201: { description: 'Créé', ...json(ref(schema)) },
          400: validation,
          409: conflict([`${domain}_DUPLICATE`]),
        },
      },
    },
    [`${path}/{id}`]: {
      get: {
        tags,
        summary: 'Détail',
        parameters: [idParam],
        responses: {
          200: { description: 'Élément', ...json(ref(schema)) },
          400: validation,
          404: notFound(domain),
        },
      },
      patch: {
        tags,
        summary: 'Modification partielle',
        parameters: [idParam],
        requestBody: { required: true, ...json(ref(`${schema}Input`)) },
        responses: {
          200: { description: 'Modifié', ...json(ref(schema)) },
          400: validation,
          404: notFound(domain),
          409: conflict(
            mergeable ? [`${domain}_DUPLICATE`, `${domain}_MERGED`] : [`${domain}_DUPLICATE`],
          ),
        },
      },
    },
  }

  if (mergeable) {
    paths[`${path}/suggest`] = {
      get: {
        tags,
        summary: 'Autocomplétion',
        description:
          'Éléments actifs dont le nom, ou celui d’un doublon fusionné, correspond à la saisie.',
        parameters: [
          query('q', { type: 'string' }, 'Saisie'),
          query('limit', { type: 'integer', minimum: 1, maximum: 50, default: 10 }, 'Limite'),
        ],
        responses: {
          200: { description: 'Suggestions', ...json(array(ref(schema))) },
          400: validation,
        },
      },
    }
    paths[`${path}/{id}/merge`] = {
      post: {
        tags,
        summary: 'Fusionne un doublon dans un élément canonique',
        parameters: [idParam],
        requestBody: { required: true, ...json(ref('MergeRequest')) },
        responses: {
          200: { description: 'Élément canonique', ...json(ref(schema)) },
          400: validation,
          404: notFound(domain),
          409: conflict([
            `${domain}_ALREADY_MERGED`,
            `${domain}_TARGET_MERGED`,
            `${domain}_TARGET_INACTIVE`,
          ]),
        },
      },
    }
  }
  return paths
}

const extraPaths: Json = {
  '/skills/resolve': {
    post: {
      tags: ['Compétences'],
      summary: 'Résout une saisie libre',
      description:
        'Renvoie la compétence existante (200) ou la crée (201) ; un nom fusionné renvoie l’élément canonique.',
      requestBody: { required: true, ...json(ref('ResolveRequest')) },
      responses: {
        200: { description: 'Compétence existante', ...json(ref('Skill')) },
        201: { description: 'Compétence créée', ...json(ref('Skill')) },
        400: validation,
        409: conflict(['SKILL_DISABLED']),
      },
    },
  },
  '/skill-levels/order': {
    put: {
      tags: ['Niveaux'],
      summary: 'Réordonne des niveaux',
      description: 'Redistribue, dans l’ordre fourni, les rangs que ces niveaux occupent déjà.',
      requestBody: { required: true, ...json(ref('OrderRequest')) },
      responses: {
        200: { description: 'Échelle complète', ...json(array(ref('SkillLevel'))) },
        400: validation,
        404: notFound('SKILL_LEVEL'),
      },
    },
  },
  '/health': {
    get: {
      tags: ['Santé'],
      summary: 'État de l’API et de la base',
      responses: {
        200: { description: 'Base joignable', ...json(ref('Health')) },
        503: { description: 'Base injoignable', ...json(ref('Health')) },
      },
    },
  },
}

/** Schema of a UUID identifier. */
const uuid: Json = { type: 'string', format: 'uuid' }
/** Nullable variant of a schema. */
const nullable = (schema: Json): Json => ({ ...schema, nullable: true })
/** Schema of an ISO 8601 date and time. */
const date: Json = { type: 'string', format: 'date-time' }
/** Properties shared by mergeable referentials. */
const mergeable: Json = {
  id: uuid,
  merged_into_id: nullable(uuid),
  active: { type: 'boolean' },
  created_at: date,
  updated_at: date,
}

const schemas: Json = {
  Error: {
    type: 'object',
    required: ['code', 'message'],
    properties: {
      code: { type: 'string', description: 'Code stable, sur lequel le frontend se base' },
      message: { type: 'string' },
      details: {},
    },
  },
  Health: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['ok', 'degraded'] },
      db: { type: 'string', enum: ['connected', 'unavailable'] },
    },
  },
  MergeRequest: {
    type: 'object',
    required: ['target_id'],
    properties: { target_id: uuid },
  },
  OrderRequest: {
    type: 'object',
    required: ['ids'],
    properties: { ids: { type: 'array', minItems: 1, uniqueItems: true, items: uuid } },
  },
  ResolveRequest: { type: 'object', required: ['name'], properties: { name: { type: 'string' } } },
  Skill: {
    type: 'object',
    properties: {
      ...mergeable,
      name: { type: 'string' },
      kind: { type: 'string', enum: ['technical', 'functional'] },
      category: nullable({ type: 'string' }),
    },
  },
  SkillInput: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      kind: { type: 'string', enum: ['technical', 'functional'] },
      category: nullable({ type: 'string' }),
      active: { type: 'boolean' },
    },
  },
  SkillLevel: {
    type: 'object',
    properties: {
      id: uuid,
      label_fr: { type: 'string' },
      label_en: nullable({ type: 'string' }),
      rank: { type: 'integer', minimum: 1 },
      active: { type: 'boolean' },
    },
  },
  SkillLevelInput: {
    type: 'object',
    required: ['label_fr', 'rank'],
    properties: {
      label_fr: { type: 'string' },
      label_en: nullable({ type: 'string' }),
      rank: { type: 'integer', minimum: 1 },
      active: { type: 'boolean' },
    },
  },
  Sector: {
    type: 'object',
    properties: {
      ...mergeable,
      name_fr: { type: 'string' },
      name_en: nullable({ type: 'string' }),
    },
  },
  SectorInput: {
    type: 'object',
    required: ['name_fr'],
    properties: {
      name_fr: { type: 'string' },
      name_en: nullable({ type: 'string' }),
      active: { type: 'boolean' },
    },
  },
  Certification: {
    type: 'object',
    properties: {
      ...mergeable,
      name: { type: 'string' },
      organization: nullable({ type: 'string' }),
    },
  },
  CertificationInput: {
    type: 'object',
    required: ['name'],
    properties: {
      name: { type: 'string' },
      organization: nullable({ type: 'string' }),
      active: { type: 'boolean' },
    },
  },
}

/** Builds the OpenAPI 3 specification served at `/api-docs`. */
export const buildOpenApiSpec = (): Json => ({
  openapi: '3.0.3',
  info: {
    title: 'CViP API',
    version: '0.0.0',
    description:
      'Gestion des CV des consultants. Toute erreur renvoie `{ code, message, details? }`.',
  },
  paths: Object.assign({}, ...REFERENTIALS.map(referentialPaths), extraPaths),
  components: { schemas },
})
