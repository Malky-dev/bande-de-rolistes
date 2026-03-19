import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";

const makeReq = () => ({}) as unknown as Request;
const makeRes = () => ({}) as unknown as Response;
const makeNext = () => vi.fn() as unknown as NextFunction;

describe("optionalAuth", () => {
  it("appelle next() après attachAuthContext réussi", async () => {
    vi.resetModules();

    const attachAuthContext = vi.fn().mockResolvedValue(true);
    vi.doMock("@/server/middleware/auth/authenticate", () => ({
      attachAuthContext,
    }));

    const mod = await import("@/server/middleware/auth/optionalAuth");
    const optionalAuth = mod.default;

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await optionalAuth(req, res, next);

    expect(attachAuthContext).toHaveBeenCalledWith(req);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("appelle next() sans répondre quand attachAuthContext échoue (pas de session)", async () => {
    vi.resetModules();

    const attachAuthContext = vi.fn().mockResolvedValue(false);
    vi.doMock("@/server/middleware/auth/authenticate", () => ({
      attachAuthContext,
    }));

    const mod = await import("@/server/middleware/auth/optionalAuth");
    const optionalAuth = mod.default;

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await optionalAuth(req, res, next);

    expect(attachAuthContext).toHaveBeenCalledWith(req);
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("log l'erreur et appelle next() quand attachAuthContext lève", async () => {
    vi.resetModules();

    const err = new Error("boom");
    const attachAuthContext = vi.fn().mockRejectedValue(err);
    vi.doMock("@/server/middleware/auth/authenticate", () => ({
      attachAuthContext,
    }));

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const mod = await import("@/server/middleware/auth/optionalAuth");
    const optionalAuth = mod.default;

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    await optionalAuth(req, res, next);

    expect(attachAuthContext).toHaveBeenCalledWith(req);
    expect(errSpy).toHaveBeenCalledWith(err);
    expect(next).toHaveBeenCalledTimes(1);

    errSpy.mockRestore();
  });
});
