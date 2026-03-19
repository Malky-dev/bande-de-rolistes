import type { Request, Response } from "express";
import type { ApiError } from "../../../types/api/errors";
import type Poll from "../../models/Poll";

type RequestUser = {
  userID?: number;
  role?: {
    roleID?: number;
  };
};

export function getUserID(req: Pick<Request, "user">): number | undefined {
  const user = req.user as RequestUser | undefined;
  return user?.userID;
}

export function getRoleID(req: Pick<Request, "user">): number | undefined {
  const user = req.user as RequestUser | undefined;
  return user?.role?.roleID;
}

export function hasRole(
  req: Pick<Request, "user">,
  allowed: number[],
): boolean {
  const roleID = req.user?.role?.roleID;
  return typeof roleID === "number" && allowed.includes(roleID);
}

export function canManagePoll(req: Pick<Request, "user">): boolean {
  return hasRole(req, [1, 2]);
}

export function canVotePoll(req: Pick<Request, "user">): boolean {
  return hasRole(req, [1, 2, 3, 4, 5]);
}

export function badRequest(res: Response, message: string): void {
  const payload: ApiError = { code: "BAD_REQUEST", message };
  res.status(400).json(payload);
}

export function forbid(res: Response, message: string): void {
  const payload: ApiError = { code: "FORBIDDEN", message };
  res.status(403).json(payload);
}

export function notFound(res: Response, message: string): void {
  const payload: ApiError = { code: "NOT_FOUND", message };
  res.status(404).json(payload);
}

export function unauthorized(res: Response, message: string): void {
  const payload: ApiError = { code: "UNAUTHORIZED", message };
  res.status(401).json(payload);
}

export function parseIntParam(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed);
}

export function isPollClosed(
  poll: Pick<Poll, "endAt" | "isClosedManually">,
): boolean {
  if (poll.isClosedManually) return true;
  return poll.endAt.getTime() <= Date.now();
}

export function normalizeString(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeOptionalString(
  value: string | null | undefined,
): string | null {
  if (value === null || value === undefined) return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeOptionLabels(values: string[] | undefined): string[] {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function uniqueNumbers(values: number[] | undefined): number[] {
  if (!Array.isArray(values)) return [];
  const validNumbers = values.filter(
    (value) => Number.isInteger(value) && value > 0,
  );
  return [...new Set(validNumbers)];
}
