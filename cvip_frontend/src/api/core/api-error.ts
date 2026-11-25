/** API call error and stable error codes, mirroring the backend `ErrorCode` type. */

type ReferentialDomain = 'SKILL' | 'SKILL_LEVEL' | 'SECTOR' | 'CERTIFICATION'
type MergeableDomain = Exclude<ReferentialDomain, 'SKILL_LEVEL'>

/** Error codes known to the application (backend plus codes produced by the client). */
export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'BAD_REQUEST'
  | 'PAYLOAD_TOO_LARGE'
  | 'NOT_FOUND'
  | 'REFERENCED_OR_MISSING'
  | 'INTERNAL_ERROR'
  | `${ReferentialDomain}_NOT_FOUND`
  | `${ReferentialDomain}_DUPLICATE`
  | `${MergeableDomain}_MERGED`
  | `${MergeableDomain}_ALREADY_MERGED`
  | `${MergeableDomain}_TARGET_MERGED`
  | `${MergeableDomain}_TARGET_INACTIVE`
  | 'SKILL_DISABLED'
  // Code produced by the client itself: the server did not respond.
  | 'NETWORK_ERROR'

/** API call error: stable code, HTTP status (0 without a response) and message. */
export class ApiError extends Error {
  code: ApiErrorCode
  status: number
  details?: unknown

  constructor(code: ApiErrorCode, status: number, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}
