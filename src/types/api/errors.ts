export type ApiErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "SESSION_EXPIRED"
  | "DUPLICATE"
  | "VALIDATION_ERROR"
  | "FOREIGN_KEY_ERROR";

export interface ApiError {
  code: ApiErrorCode;
  message: string;
}
