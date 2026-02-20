export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'NOT_FOUND'
  | 'ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'

export interface ApiError {
  code: ApiErrorCode
  message: string
}