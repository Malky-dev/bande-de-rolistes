import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/account/updateAccount.ts"),
).href;

const modelsUrl = new URL("../../models", controllerUrl).href;

const makeRes = <TRes>() => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as Record<string, unknown>;
  const res = resObj as unknown as TRes;
  return { res, status, json };
};

async function load(opts?: {
  findByPkResult?: unknown;
  findByPkReject?: unknown;
  saveReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const userSave = vi.fn();

  if (opts && "saveReject" in opts && opts.saveReject !== undefined) {
    const r = opts.saveReject;
    if (r instanceof Error) userSave.mockRejectedValue(r);
    else
      userSave.mockImplementation(() => {
        throw r;
      });
  } else {
    userSave.mockResolvedValue(undefined);
  }

  const defaultUser = {
    userID: 7,
    nickname: "Neo",
    email: "neo@matrix.tld",
    discordId: "123",
    save: userSave,
  };

  const User = {
    findByPk: vi.fn(),
  };

  if (opts && "findByPkReject" in opts && opts.findByPkReject !== undefined) {
    const r = opts.findByPkReject;
    if (r instanceof Error) User.findByPk.mockRejectedValue(r);
    else
      User.findByPk.mockImplementation(() => {
        throw r;
      });
  } else if (opts && "findByPkResult" in opts) {
    User.findByPk.mockResolvedValue(opts.findByPkResult);
  } else {
    User.findByPk.mockResolvedValue(defaultUser);
  }

  vi.doMock(modelsUrl, () => ({ User }));

  const mod = await import(controllerUrl);
  const controllerUpdateAccount = mod.default;

  type ReqT = Parameters<typeof controllerUpdateAccount>[0];
  type ResT = Parameters<typeof controllerUpdateAccount>[1];

  const makeReq = (data?: { user?: unknown; body?: unknown }): ReqT =>
    ({ user: data?.user, body: data?.body ?? {} }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerUpdateAccount,
    makeReq,
    makeTypedRes,
    mocks: { User, userSave },
  };
}

describe("controllerUpdateAccount", () => {
  it("401 si pas authentifié", async () => {
    const { controllerUpdateAccount, makeReq, makeTypedRes } = await load();

    const req = makeReq({ user: undefined, body: {} });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("404 si user introuvable", async () => {
    const { controllerUpdateAccount, makeReq, makeTypedRes, mocks } =
      await load({
        findByPkResult: null,
      });

    const req = makeReq({ user: { userID: 7 }, body: {} });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  });

  it("400 si nickname trop court après trim", async () => {
    const { controllerUpdateAccount, makeReq, makeTypedRes } = await load();

    const req = makeReq({ user: { userID: 7 }, body: { nickname: " a " } });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le pseudo doit faire entre 2 et 100 caractères.",
    });
  });

  it("400 si nickname trop long", async () => {
    const { controllerUpdateAccount, makeReq, makeTypedRes } = await load();

    const req = makeReq({
      user: { userID: 7 },
      body: { nickname: "a".repeat(101) },
    });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le pseudo doit faire entre 2 et 100 caractères.",
    });
  });

  it("200: update nickname (trim) + save + payload", async () => {
    const user = {
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: "123",
      save: vi.fn().mockResolvedValue(undefined),
    };

    const { controllerUpdateAccount, makeReq, makeTypedRes, mocks } =
      await load({
        findByPkResult: user,
      });

    const req = makeReq({
      user: { userID: 7 },
      body: { nickname: "  Trinity  " },
    });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(user.nickname).toBe("Trinity");
    expect(user.save).toHaveBeenCalled();
    expect(status).not.toHaveBeenCalledWith(400);
    expect(status).not.toHaveBeenCalledWith(401);
    expect(status).not.toHaveBeenCalledWith(404);
    expect(status).not.toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      userID: 7,
      nickname: "Trinity",
      email: "neo@matrix.tld",
      discordId: "123",
    });
  });

  it("200: nickname absent => save + payload inchangé", async () => {
    const user = {
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: null,
      save: vi.fn().mockResolvedValue(undefined),
    };

    const { controllerUpdateAccount, makeReq, makeTypedRes } = await load({
      findByPkResult: user,
    });

    const req = makeReq({ user: { userID: 7 }, body: {} });
    const { res, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(user.save).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: null,
    });
  });

  it("500 si Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdateAccount, makeReq, makeTypedRes } = await load({
      findByPkReject: new Error("boom"),
    });

    const req = makeReq({ user: { userID: 7 }, body: {} });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdateAccount, makeReq, makeTypedRes } = await load({
      findByPkReject: "nope",
    });

    const req = makeReq({ user: { userID: 7 }, body: {} });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateAccount(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
