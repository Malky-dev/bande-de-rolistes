import type { Response } from 'express'
import type { ApiError } from '../../../types/api/errors'

type RoleLike = { roleID: number }
type UserLike = { userID: number; Role?: RoleLike }

export type ReqWithUserLike = {
  user?: UserLike
}

export function getRoleID(req: ReqWithUserLike): number | undefined {
  return req.user?.Role?.roleID
}

export function getUserID(req: ReqWithUserLike): number | undefined {
  return req.user?.userID
}

export function hasRole(req: ReqWithUserLike, allowed: number[]): boolean {
  const roleID = getRoleID(req)
  return typeof roleID === 'number' && allowed.includes(roleID)
}

export function forbid(res: Response<ApiError>, message: string): void {
  const payload: ApiError = { code: 'FORBIDDEN', message }
  res.status(403).json(payload)
}

export function badRequest(res: Response<ApiError>, message: string): void {
  const payload: ApiError = { code: 'BAD_REQUEST', message }
  res.status(400).json(payload)
}

export function notFound(res: Response<ApiError>, message: string): void {
  const payload: ApiError = { code: 'NOT_FOUND', message }
  res.status(404).json(payload)
}

export function parseIntParam(value: string): number | null {
  if (!/^\d+$/.test(value)) {
    return null
  }

  const n = Number(value)
  if (!Number.isFinite(n)) {
    return null
  }

  return Math.floor(n)
}