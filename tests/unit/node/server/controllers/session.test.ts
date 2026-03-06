import { describe, it, expect, vi } from "vitest";
import type { NextFunction } from "express";

type ReqGet = {
  (name: "set-cookie"): string[] | undefined;
  (name: string): string | undefined;
};

const makeGet = (cookie?: string): ReqGet =>
  ((name: string) =>
    name.toLowerCase() === "cookie" ? cookie : undefined) as ReqGet;

async function load(opts?: {
  token?: string | undefined;
  sessionResult?: unknown;
  findOneReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const gt = Symbol("gt");
  vi.doMock("sequelize", () => ({ Op: { gt } }));

  const getCookieValue = vi.fn();
  getCookieValue.mockReturnValue(opts?.token);

  const Session = { findOne: vi.fn() };

  if (opts?.findOneReject !== undefined) {
    if (opts.findOneReject instanceof Error) {
      Session.findOne.mockRejectedValue(opts.findOneReject);
    } else {
      Session.findOne.mockImplementation(() => {
        throw opts.findOneReject;
      });
    }
  } else {
    Session.findOne.mockResolvedValue(opts?.sessionResult ?? null);
  }

  const User = {};
  const Role = {};

  vi.doMock("@/server/utils/cookies", () => ({ getCookieValue }));
  vi.doMock("@/server/models", () => ({ Session, User, Role }));
  vi.doMock("@/server/models/index", () => ({ Session, User, Role }));

  const mod = await import("@/server/controllers/session");
  const controllerSession = mod.default;

  type ReqT = Parameters<typeof controllerSession>[0];
  type ResT = Parameters<typeof controllerSession>[1];
  type NextT = Parameters<typeof controllerSession>[2];

  const makeReq = (cookie?: string): ReqT =>
    ({ get: makeGet(cookie) }) as unknown as ReqT;

  const makeRes = (): ResT => {
    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    return res as unknown as ResT;
  };

  const makeNext = (): NextT => vi.fn() as unknown as NextFunction as NextT;

  return {
    controllerSession,
    makeReq,
    makeRes,
    makeNext,
    mocks: { getCookieValue, Session },
  };
}

describe("controllerSession", () => {
  it("401 si pas de Cookie header", async () => {
    const { controllerSession, makeReq, makeRes, makeNext } = await load({
      token: undefined,
    });

    const req = makeReq(undefined);
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Session non trouvée",
    });
  });

  it("401 si getCookieValue ne trouve pas le token", async () => {
    const { controllerSession, makeReq, makeRes, makeNext, mocks } = await load(
      {
        token: undefined,
      },
    );

    const req = makeReq("a=b");
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(mocks.getCookieValue).toHaveBeenCalledWith(
      "a=b",
      "bande_de_rolistes",
    );
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Session non trouvée",
    });
  });

  it("401 si Session.findOne retourne null", async () => {
    const { controllerSession, makeReq, makeRes, makeNext, mocks } = await load(
      {
        token: "t",
        sessionResult: null,
      },
    );

    const req = makeReq("bande_de_rolistes=t");
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(mocks.Session.findOne).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Session expirée ou invalide",
    });
  });

  it("401 si Session.findOne retourne une session sans user", async () => {
    const { controllerSession, makeReq, makeRes, makeNext } = await load({
      token: "t",
      sessionResult: { user: undefined },
    });

    const req = makeReq("bande_de_rolistes=t");
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Session expirée ou invalide",
    });
  });

  it("200: rôle par défaut si user.role absent", async () => {
    const { controllerSession, makeReq, makeRes, makeNext } = await load({
      token: "t",
      sessionResult: {
        user: { userID: 7, nickname: "Neo", isVerified: 0, role: undefined },
      },
    });

    const req = makeReq("bande_de_rolistes=t");
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      userID: 7,
      nickname: "Neo",
      roleID: 5,
      role: "member",
      isVerified: false,
    });
  });

  it("200: rôle présent", async () => {
    const { controllerSession, makeReq, makeRes, makeNext } = await load({
      token: "t",
      sessionResult: {
        user: {
          userID: 1,
          nickname: "Boss",
          isVerified: 1,
          role: { roleID: 1, roleLabel: "admin" },
        },
      },
    });

    const req = makeReq("bande_de_rolistes=t");
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      userID: 1,
      nickname: "Boss",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });
  });

  it("500 si Session.findOne rejette avec Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerSession, makeReq, makeRes, makeNext } = await load({
      token: "t",
      findOneReject: new Error("boom"),
    });

    const req = makeReq("bande_de_rolistes=t");
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerSession, makeReq, makeRes, makeNext } = await load({
      token: "t",
      findOneReject: "nope",
    });

    const req = makeReq("bande_de_rolistes=t");
    const res = makeRes();
    const next = makeNext();

    await controllerSession(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
