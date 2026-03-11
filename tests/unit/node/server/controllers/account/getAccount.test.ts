import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

type Fn = ReturnType<typeof vi.fn>;

const makeRes = () => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as Record<string, unknown>;
  const res = resObj as unknown;
  return { res, status, json };
};

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/account/getAccount.ts"),
).href;

const modelsIndexUrl = pathToFileURL(
  path.join(root, "src/server/models/index.ts"),
).href;

async function load(opts?: {
  findByPkResult?: unknown;
  findByPkReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const User = {
    findByPk: vi.fn(),
  };

  if (opts?.findByPkReject !== undefined) {
    if (opts.findByPkReject instanceof Error)
      User.findByPk.mockRejectedValue(opts.findByPkReject);
    else
      User.findByPk.mockImplementation(() => {
        throw opts.findByPkReject;
      });
  } else {
    User.findByPk.mockResolvedValue(opts?.findByPkResult ?? null);
  }

  vi.doMock(modelsIndexUrl, () => ({ User }));

  const mod = await import(controllerUrl);
  const controllerGetAccount = mod.default;

  type ReqT = Parameters<typeof controllerGetAccount>[0];
  type ResT = Parameters<typeof controllerGetAccount>[1];

  const makeReq = (user?: unknown): ReqT => ({ user }) as unknown as ReqT;

  const makeTypedRes = () => {
    const { res, status, json } = makeRes();
    return { res: res as unknown as ResT, status, json };
  };

  return { controllerGetAccount, makeReq, makeTypedRes, mocks: { User } };
}

describe("controllerGetAccount", () => {
  it("401 si pas authentifié", async () => {
    const { controllerGetAccount, makeReq, makeTypedRes } = await load();

    const req = makeReq(undefined);
    const { res, status, json } = makeTypedRes();

    await controllerGetAccount(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("404 si user introuvable", async () => {
    const { controllerGetAccount, makeReq, makeTypedRes, mocks } = await load({
      findByPkResult: null,
    });

    const req = makeReq({ userID: 7 });
    const { res, status, json } = makeTypedRes();

    await controllerGetAccount(req, res);

    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Utilisateur introuvable",
    });
  });

  it("200 payload si ok", async () => {
    const user = {
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: "123",
    };

    const { controllerGetAccount, makeReq, makeTypedRes, mocks } = await load({
      findByPkResult: user,
    });

    const req = makeReq({ userID: 7 });
    const { res, status, json } = makeTypedRes();

    await controllerGetAccount(req, res);

    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(status).not.toHaveBeenCalledWith(401);
    expect(status).not.toHaveBeenCalledWith(404);
    expect(status).not.toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: "123",
    });
  });

  it("500 si Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerGetAccount, makeReq, makeTypedRes } = await load({
      findByPkReject: new Error("boom"),
    });

    const req = makeReq({ userID: 7 });
    const { res, status, json } = makeTypedRes();

    await controllerGetAccount(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerGetAccount, makeReq, makeTypedRes } = await load({
      findByPkReject: "nope",
    });

    const req = makeReq({ userID: 7 });
    const { res, status, json } = makeTypedRes();

    await controllerGetAccount(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
