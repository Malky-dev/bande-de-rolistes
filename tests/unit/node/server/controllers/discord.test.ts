import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { NextFunction } from "express";

type ReqGet = {
  (name: "set-cookie"): string[] | undefined;
  (name: string): string | undefined;
};

type Fn = ReturnType<typeof vi.fn>;

const makeGet = (headers?: Record<string, string | undefined>): ReqGet =>
  ((name: string) => {
    const key = name.toLowerCase();
    if (key === "user-agent") return headers?.["user-agent"];
    return undefined;
  }) as ReqGet;

const makeResWith = <TRes, K extends string>(keys: readonly K[]) => {
  const fns = Object.fromEntries(keys.map((k) => [k, vi.fn()])) as Record<
    K,
    Fn
  >;
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { ...fns, status, json } as Record<string, unknown>;
  const res = resObj as unknown as TRes;
  return { res, fns, status, json };
};

const root = process.cwd();

const controllerPath = pathToFileURL(
  path.join(root, "src/server/controllers/discord.ts"),
).href;

const globalPath = pathToFileURL(path.join(root, "src/server/global.ts")).href;

const modelsIndexPath = pathToFileURL(
  path.join(root, "src/server/models/index.ts"),
).href;

async function load(opts?: {
  generateAuthUrlThrow?: unknown;
  tokenRequestReject?: unknown;
  getUserReject?: unknown;
  getUserResult?: unknown;
  tokenResponse?: { access_token: string };
  userFindOneResults?: Array<unknown>;
  userCreateResult?: unknown;
  userCreateReject?: unknown;
  sessionCreateReject?: unknown;
  generateSessionToken?: string;
  hashPassword?: string;
  deviceParse?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  process.env.DISCORD_CLIENT_ID = "id";
  process.env.DISCORD_CLIENT_SECRET = "secret";
  process.env.DISCORD_REDIRECT_URI = "http://localhost/callback";
  process.env.FRONTEND_URL = "http://frontend.local";

  const oauthInstance = {
    generateAuthUrl: vi.fn(),
    tokenRequest: vi.fn(),
    getUser: vi.fn(),
  };

  if (opts?.generateAuthUrlThrow !== undefined) {
    oauthInstance.generateAuthUrl.mockImplementation(() => {
      throw opts.generateAuthUrlThrow;
    });
  } else {
    oauthInstance.generateAuthUrl.mockReturnValue("http://discord.auth/url");
  }

  if (opts?.tokenRequestReject !== undefined) {
    if (opts.tokenRequestReject instanceof Error) {
      oauthInstance.tokenRequest.mockRejectedValue(opts.tokenRequestReject);
    } else {
      oauthInstance.tokenRequest.mockImplementation(() => {
        throw opts.tokenRequestReject;
      });
    }
  } else {
    oauthInstance.tokenRequest.mockResolvedValue(
      opts?.tokenResponse ?? { access_token: "access" },
    );
  }

  if (opts?.getUserReject !== undefined) {
    if (opts.getUserReject instanceof Error) {
      oauthInstance.getUser.mockRejectedValue(opts.getUserReject);
    } else {
      oauthInstance.getUser.mockImplementation(() => {
        throw opts.getUserReject;
      });
    }
  } else {
    oauthInstance.getUser.mockResolvedValue(
      opts?.getUserResult ?? {
        id: "123",
        email: "a@b.c",
        username: "u",
        verified: true,
      },
    );
  }

  function DiscordOAuth2Ctor(this: unknown) {
    return oauthInstance;
  }

  vi.doMock("discord-oauth2", () => ({
    __esModule: true,
    default: DiscordOAuth2Ctor,
  }));

  const deviceDetectorInstance = { parse: vi.fn() };
  deviceDetectorInstance.parse.mockReturnValue(
    opts?.deviceParse ?? {
      device: { type: "desktop" },
      client: { name: "Chrome" },
    },
  );

  function DeviceDetectorCtor(this: unknown) {
    return deviceDetectorInstance;
  }

  vi.doMock("device-detector-js", () => ({
    __esModule: true,
    default: DeviceDetectorCtor,
  }));

  const hashPassword = vi
    .fn()
    .mockResolvedValue(opts?.hashPassword ?? "hashed");
  const generateSessionToken = vi
    .fn()
    .mockReturnValue(opts?.generateSessionToken ?? "tok");

  const findOneQueue = [...(opts?.userFindOneResults ?? [])];

  const User = {
    findOne: vi
      .fn()
      .mockImplementation(async () =>
        findOneQueue.length ? findOneQueue.shift() : null,
      ),
    create: vi.fn(),
  };

  if (opts?.userCreateReject !== undefined) {
    if (opts.userCreateReject instanceof Error) {
      User.create.mockRejectedValue(opts.userCreateReject);
    } else {
      User.create.mockImplementation(() => {
        throw opts.userCreateReject;
      });
    }
  } else {
    User.create.mockResolvedValue(
      opts?.userCreateResult ??
        ({
          userID: 42,
          save: vi.fn().mockResolvedValue(undefined),
        } as unknown),
    );
  }

  const Session = { create: vi.fn() };

  if (opts?.sessionCreateReject !== undefined) {
    if (opts.sessionCreateReject instanceof Error) {
      Session.create.mockRejectedValue(opts.sessionCreateReject);
    } else {
      Session.create.mockImplementation(() => {
        throw opts.sessionCreateReject;
      });
    }
  } else {
    Session.create.mockResolvedValue(undefined);
  }

  vi.doMock(globalPath, () => ({ hashPassword, generateSessionToken }));
  vi.doMock(modelsIndexPath, () => ({ User, Session }));

  const mod = await import(controllerPath);

  const controllerDiscordInit = mod.controllerDiscordInit as unknown;
  const controllerDiscordCallback = mod.controllerDiscordCallback as unknown;

  const init = controllerDiscordInit as (...args: unknown[]) => unknown;
  const cb = controllerDiscordCallback as (...args: unknown[]) => unknown;

  type InitReq = Parameters<typeof init>[0];
  type InitRes = Parameters<typeof init>[1];

  type CbReq = Parameters<typeof cb>[0];
  type CbRes = Parameters<typeof cb>[1];

  const makeReqInit = (q?: { state?: unknown }): InitReq =>
    ({ query: q ?? {} }) as unknown as InitReq;

  const makeReqCb = (
    q?: { code?: unknown },
    headers?: { "user-agent"?: string },
  ): CbReq => ({ query: q ?? {}, get: makeGet(headers) }) as unknown as CbReq;

  const makeResInit = () =>
    makeResWith<InitRes, "redirect">(["redirect"] as const);
  const makeResCb = () =>
    makeResWith<CbRes, "redirect" | "cookie">(["redirect", "cookie"] as const);

  const makeNext = (): NextFunction => vi.fn() as unknown as NextFunction;

  return {
    controllerDiscordInit: init,
    controllerDiscordCallback: cb,
    makeReqInit,
    makeReqCb,
    makeResInit,
    makeResCb,
    makeNext,
    mocks: {
      oauthInstance,
      deviceDetectorInstance,
      User,
      Session,
      hashPassword,
      generateSessionToken,
    },
  };
}

describe("discord controllers", () => {
  it("controllerDiscordInit: redirect vers url oauth", async () => {
    const { controllerDiscordInit, makeReqInit, makeResInit, makeNext, mocks } =
      await load();

    const req = makeReqInit({ state: "s" });
    const { res, fns } = makeResInit();
    const next = makeNext();

    controllerDiscordInit(req, res, next);

    expect(mocks.oauthInstance.generateAuthUrl).toHaveBeenCalled();
    expect(fns.redirect).toHaveBeenCalledWith("http://discord.auth/url");
  });

  it("controllerDiscordInit: 500 si erreur", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerDiscordInit, makeReqInit, makeResInit, makeNext } =
      await load({
        generateAuthUrlThrow: new Error("boom"),
      });

    const req = makeReqInit({ state: "s" });
    const { res, status, json } = makeResInit();
    const next = makeNext();

    controllerDiscordInit(req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("controllerDiscordCallback: 400 si code manquant", async () => {
    const { controllerDiscordCallback, makeReqCb, makeResCb, makeNext } =
      await load();

    const req = makeReqCb({});
    const { res, status, json } = makeResCb();
    const next = makeNext();

    await controllerDiscordCallback(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Code Discord manquant",
    });
  });

  it("controllerDiscordCallback: 400 si discord user sans id", async () => {
    const { controllerDiscordCallback, makeReqCb, makeResCb, makeNext } =
      await load({
        getUserResult: { email: "a@b.c" },
      });

    const req = makeReqCb({ code: "c" });
    const { res, status, json } = makeResCb();
    const next = makeNext();

    await controllerDiscordCallback(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Impossible de récupérer les informations Discord",
    });
  });

  it("controllerDiscordCallback: user trouvé par discordId -> session + redirect", async () => {
    const user = { userID: 7 } as unknown;

    const { controllerDiscordCallback, makeReqCb, makeResCb, makeNext, mocks } =
      await load({
        userFindOneResults: [user],
        getUserResult: { id: "123" },
        generateSessionToken: "t",
      });

    const req = makeReqCb({ code: "c" }, { "user-agent": "ua" });
    const { res, fns } = makeResCb();
    const next = makeNext();

    await controllerDiscordCallback(req, res, next);

    expect(mocks.User.findOne).toHaveBeenCalledTimes(1);
    expect(mocks.Session.create).toHaveBeenCalledTimes(1);
    expect(fns.redirect).toHaveBeenCalledWith("http://frontend.local");
  });

  it("controllerDiscordCallback: user trouvé par email -> save -> session + redirect", async () => {
    const savedUser = {
      userID: 9,
      discordId: undefined as unknown,
      save: vi.fn().mockResolvedValue(undefined),
    } as unknown as {
      userID: number;
      discordId?: string;
      save: () => Promise<void>;
    };

    const { controllerDiscordCallback, makeReqCb, makeResCb, makeNext, mocks } =
      await load({
        userFindOneResults: [null, savedUser as unknown],
        getUserResult: { id: "123", email: "a@b.c" },
        generateSessionToken: "t",
      });

    const req = makeReqCb({ code: "c" }, { "user-agent": "ua" });
    const { res, fns } = makeResCb();
    const next = makeNext();

    await controllerDiscordCallback(req, res, next);

    expect(mocks.User.findOne).toHaveBeenCalledTimes(2);
    expect(savedUser.save).toHaveBeenCalledTimes(1);
    expect(mocks.Session.create).toHaveBeenCalledTimes(1);
    expect(fns.redirect).toHaveBeenCalledWith("http://frontend.local");
  });

  it("controllerDiscordCallback: crée user si inexistant -> session + redirect", async () => {
    const createdUser = { userID: 42 } as unknown;

    const { controllerDiscordCallback, makeReqCb, makeResCb, makeNext, mocks } =
      await load({
        userFindOneResults: [null, null],
        userCreateResult: createdUser,
        getUserResult: {
          id: "123",
          email: "a@b.c",
          username: "u",
          verified: false,
        },
        hashPassword: "h",
        generateSessionToken: "t",
      });

    const req = makeReqCb({ code: "c" }, { "user-agent": "ua" });
    const { res, fns } = makeResCb();
    const next = makeNext();

    await controllerDiscordCallback(req, res, next);

    expect(mocks.hashPassword).toHaveBeenCalledTimes(1);
    expect(mocks.User.create).toHaveBeenCalledTimes(1);
    expect(mocks.Session.create).toHaveBeenCalledTimes(1);
    expect(fns.redirect).toHaveBeenCalledWith("http://frontend.local");
  });

  it("controllerDiscordCallback: 500 si erreur Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerDiscordCallback, makeReqCb, makeResCb, makeNext } =
      await load({
        tokenRequestReject: new Error("boom"),
      });

    const req = makeReqCb({ code: "c" });
    const { res, status, json } = makeResCb();
    const next = makeNext();

    await controllerDiscordCallback(req, res, next);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });
});
