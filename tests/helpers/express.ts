import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";

type HeaderGetter = {
  (name: "set-cookie"): string[] | undefined;
  (name: string): string | undefined;
};

export function makeReq(overrides?: Partial<Request>): Request {
  const get: HeaderGetter = (_name: string) => undefined;

  const base = {
    headers: {},
    get,
    user: undefined,
    session: undefined,
  } satisfies Partial<Request>;

  return { ...base, ...(overrides ?? {}) } as Request;
}

export type ResLike = Pick<Response, "status" | "json">;

export function makeRes(): ResLike {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

export function makeNext(): NextFunction {
  return vi.fn() as NextFunction;
}
