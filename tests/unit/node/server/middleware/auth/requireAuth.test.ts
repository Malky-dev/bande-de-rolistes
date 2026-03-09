import { describe, it, expect, vi } from "vitest";
import type { Request, Response, NextFunction } from "express";

const makeReq = () =>
  ({
    headers: {},
    cookies: {},
    user: undefined,
    session: undefined,
  }) as unknown as Request;

const makeRes = () => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  return { res: { status, json } as unknown as Response, status, json };
};

const makeNext = () => vi.fn() as unknown as NextFunction;

describe("requireAuth", () => {
  it("401 si token absent", async () => {
    vi.resetModules();

    vi.doMock("@/server/middleware/auth/token", () => ({
      extractAuthToken: vi.fn().mockReturnValue(undefined),
    }));

    const Session = { findOne: vi.fn() };
    vi.doMock("@/server/models", () => ({ Session, User: {}, Role: {} }));

    const mod = await import("@/server/middleware/auth/requireAuth");
    const requireAuth = mod.default;

    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = makeNext();

    await requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Token required",
    });
  });

  it("401 si token invalide (session null)", async () => {
    vi.resetModules();

    vi.doMock("@/server/middleware/auth/token", () => ({
      extractAuthToken: vi.fn().mockReturnValue("tok"),
    }));

    const Session = { findOne: vi.fn().mockResolvedValue(null) };
    vi.doMock("@/server/models", () => ({ Session, User: {}, Role: {} }));

    const mod = await import("@/server/middleware/auth/requireAuth");
    const requireAuth = mod.default;

    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = makeNext();

    await requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Invalid token",
    });
  });

  it("500 si user.role manquant", async () => {
    vi.resetModules();

    vi.doMock("@/server/middleware/auth/token", () => ({
      extractAuthToken: vi.fn().mockReturnValue("tok"),
    }));

    const Session = {
      findOne: vi.fn().mockResolvedValue({
        sessionID: 1,
        token: "tok",
        expiration: new Date(Date.now() + 10000),
        user: { userID: 7, nickname: "Neo", role: null },
      }),
    };

    vi.doMock("@/server/models", () => ({ Session, User: {}, Role: {} }));

    const mod = await import("@/server/middleware/auth/requireAuth");
    const requireAuth = mod.default;

    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = makeNext();

    await requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "User role missing",
    });
  });

  it("200: set req.user + req.session + next()", async () => {
    vi.resetModules();

    vi.doMock("@/server/middleware/auth/token", () => ({
      extractAuthToken: vi.fn().mockReturnValue("tok"),
    }));

    const Session = {
      findOne: vi.fn().mockResolvedValue({
        sessionID: 1,
        token: "tok",
        expiration: new Date(Date.now() + 10000),
        user: {
          userID: 7,
          nickname: "Neo",
          role: { roleID: 2, roleLabel: "admin" },
        },
      }),
    };

    vi.doMock("@/server/models", () => ({ Session, User: {}, Role: {} }));

    const mod = await import("@/server/middleware/auth/requireAuth");
    const requireAuth = mod.default;

    const req = makeReq();
    const { res } = makeRes();
    const next = makeNext();

    await requireAuth(req, res, next);

    expect(req.user?.userID).toBe(7);
    expect(req.user?.role?.roleID).toBe(2);
    expect(req.session?.token).toBe("tok");
    expect(next).toHaveBeenCalled();
  });

  it("500 si erreur non-Error", async () => {
    vi.resetModules();

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.doMock("@/server/middleware/auth/token", () => ({
      extractAuthToken: vi.fn().mockReturnValue("tok"),
    }));

    const Session = {
      findOne: vi.fn().mockImplementation(() => {
        throw "nope";
      }),
    };
    vi.doMock("@/server/models", () => ({ Session, User: {}, Role: {} }));

    const mod = await import("@/server/middleware/auth/requireAuth");
    const requireAuth = mod.default;

    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = makeNext();

    await requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });

  it("500 si erreur Error(message)", async () => {
    vi.resetModules();

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.doMock("@/server/middleware/auth/token", () => ({
      extractAuthToken: vi.fn().mockReturnValue("tok"),
    }));

    const Session = {
      findOne: vi.fn().mockRejectedValue(new Error("boom")),
    };
    vi.doMock("@/server/models", () => ({ Session, User: {}, Role: {} }));

    const mod = await import("@/server/middleware/auth/requireAuth");
    const requireAuth = mod.default;

    const req = makeReq();
    const { res, status, json } = makeRes();
    const next = makeNext();

    await requireAuth(req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "boom",
    });

    errSpy.mockRestore();
  });
});
