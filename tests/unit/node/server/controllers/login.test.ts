import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeReq } from "@/../tests/helpers/express";

type LoadOpts = {
  nodeEnv?: string;
  user?: any;
  compareOk?: boolean;
  token?: string;
  deviceParse?: any;
  userFindOneError?: any;
};

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
  cookie: vi.fn().mockReturnThis(),
});

async function load(opts: LoadOpts = {}) {
  vi.resetModules();
  vi.clearAllMocks();

  if (opts.nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = opts.nodeEnv;

  const comparePassword = vi.fn();
  const generateSessionToken = vi.fn();

  const User = { findOne: vi.fn() };
  const Session = { create: vi.fn().mockResolvedValue(undefined) };
  const Role = {};

  const parseMock = vi.fn();

  if (opts.userFindOneError !== undefined) {
    if (opts.userFindOneError instanceof Error)
      User.findOne.mockRejectedValue(opts.userFindOneError);
    else
      User.findOne.mockImplementation(() => {
        throw opts.userFindOneError;
      });
  } else {
    User.findOne.mockResolvedValue(opts.user ?? null);
  }

  if (opts.compareOk !== undefined)
    comparePassword.mockResolvedValue(opts.compareOk);

  if (opts.token !== undefined)
    generateSessionToken.mockReturnValue(opts.token);

  if (opts.deviceParse !== undefined)
    parseMock.mockReturnValue(opts.deviceParse);
  else parseMock.mockReturnValue({});

  vi.doMock("@/server/global", () => ({
    comparePassword,
    generateSessionToken,
  }));
  vi.doMock("@/server/models", () => ({ User, Session, Role }));
  vi.doMock("@/server/models/index", () => ({ User, Session, Role }));
  vi.doMock("device-detector-js", () => {
    function DeviceDetectorMock(this: any) {
      return { parse: parseMock };
    }
    return { default: DeviceDetectorMock };
  });

  const { default: controllerLogin } =
    await import("@/server/controllers/login");

  return {
    controllerLogin,
    mocks: {
      comparePassword,
      generateSessionToken,
      User,
      Session,
      Role,
      parseMock,
    },
  };
}

describe("controllerLogin", () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  it("400 si email n'est pas string", async () => {
    const { controllerLogin } = await load();

    const req = makeReq({ body: { email: 123, password: "x" } });
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "l'email est invalide",
    });
  });

  it("400 si password n'est pas string", async () => {
    const { controllerLogin } = await load();

    const req = makeReq({ body: { email: "a@b.c", password: 123 } });
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "le mot de passe doit être une chaîne de caractères",
    });
  });

  it("404 si user introuvable", async () => {
    const { controllerLogin } = await load({ user: null });

    const req = makeReq({ body: { email: "a@b.c", password: "pw" } });
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Le nom d'utilisateur n'est pas disponible",
    });
  });

  it("404 si user shape invalide", async () => {
    const { controllerLogin } = await load({ user: { userID: 1 } });

    const req = makeReq({ body: { email: "a@b.c", password: "pw" } });
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Le nom d'utilisateur n'est pas disponible",
    });
  });

  it("404 si password incorrect", async () => {
    const { controllerLogin, mocks } = await load({
      user: { userID: 1, password: "hash" },
      compareOk: false,
    });

    const req = makeReq({ body: { email: "a@b.c", password: "pw" } });
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(mocks.comparePassword).toHaveBeenCalledWith("pw", "hash");
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Le mot de passe est incorrect",
    });
  });

  it("200: crée session + cookie + json", async () => {
    const { controllerLogin, mocks } = await load({
      user: { userID: 7, password: "hash" },
      compareOk: true,
      token: "tok123",
      deviceParse: {},
    });

    const req = makeReq({ body: { email: "a@b.c", password: "pw" } });
    (req as any).get = vi.fn(() => "UA");
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(mocks.Session.create).toHaveBeenCalledTimes(1);
    const created = mocks.Session.create.mock.calls[0][0];

    expect(created.userID).toBe(7);
    expect(created.token).toBe("tok123");
    expect(created.device).toBeNull();
    expect(created.browser).toBeNull();
    expect(created.expiration).toBeInstanceOf(Date);

    expect(res.cookie).toHaveBeenCalledWith(
      "bande_de_rolistes",
      "tok123",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      }),
    );

    expect(res.json).toHaveBeenCalledWith({ token: "tok123" });
  });

  it("200: secure=true en production + device/browser", async () => {
    const { controllerLogin, mocks } = await load({
      nodeEnv: "production",
      user: { userID: 7, password: "hash" },
      compareOk: true,
      token: "tok456",
      deviceParse: {
        device: { type: "smartphone" },
        client: { name: "Chrome" },
      },
    });

    const req = makeReq({ body: { email: "a@b.c", password: "pw" } });
    (req as any).get = vi.fn(() => "UA");
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(mocks.Session.create).toHaveBeenCalledTimes(1);
    const created = mocks.Session.create.mock.calls[0][0];

    expect(created.device).toBe("smartphone");
    expect(created.browser).toBe("Chrome");

    const cookieOpts = res.cookie.mock.calls[0][2];
    expect(cookieOpts.secure).toBe(true);
  });

  it("500 si exception Error", async () => {
    const { controllerLogin } = await load({
      userFindOneError: new Error("boom"),
    });

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = makeReq({ body: { email: "a@b.c", password: "pw" } });
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("500 si exception non-Error", async () => {
    const { controllerLogin } = await load({ userFindOneError: "nope" });

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const req = makeReq({ body: { email: "a@b.c", password: "pw" } });
    const res = makeRes();

    await controllerLogin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur inconnue",
    });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
