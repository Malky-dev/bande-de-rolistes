import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/admin/updateRole.ts"),
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
  roleFindByPkResult?: unknown;
  roleFindByPkReject?: unknown;

  userFindByPkFirstResult?: unknown;
  userFindByPkSecondResult?: unknown;
  userFindByPkReject?: unknown;

  userUpdateReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Role = {
    findByPk: vi.fn(),
  };

  if (
    opts &&
    "roleFindByPkReject" in opts &&
    opts.roleFindByPkReject !== undefined
  ) {
    const r = opts.roleFindByPkReject;
    if (r instanceof Error) Role.findByPk.mockRejectedValue(r);
    else
      Role.findByPk.mockImplementation(() => {
        throw r;
      });
  } else if (opts && "roleFindByPkResult" in opts) {
    Role.findByPk.mockResolvedValue(opts.roleFindByPkResult);
  } else {
    Role.findByPk.mockResolvedValue({ roleID: 2, roleLabel: "admin" });
  }

  const userUpdate = vi.fn();
  if (
    opts &&
    "userUpdateReject" in opts &&
    opts.userUpdateReject !== undefined
  ) {
    const r = opts.userUpdateReject;
    if (r instanceof Error) userUpdate.mockRejectedValue(r);
    else
      userUpdate.mockImplementation(() => {
        throw r;
      });
  } else {
    userUpdate.mockResolvedValue(undefined);
  }

  const firstUser =
    opts && "userFindByPkFirstResult" in opts
      ? opts.userFindByPkFirstResult
      : ({
          userID: 7,
          roleID: 1,
          update: userUpdate,
        } as unknown);

  const secondUser =
    opts && "userFindByPkSecondResult" in opts
      ? opts.userFindByPkSecondResult
      : ({
          userID: 7,
          nickname: "Neo",
          email: "neo@matrix.tld",
          roleID: 2,
          isVerified: true,
          role: { roleID: 2, roleLabel: "admin" },
        } as unknown);

  const User = {
    findByPk: vi.fn(),
  };

  if (
    opts &&
    "userFindByPkReject" in opts &&
    opts.userFindByPkReject !== undefined
  ) {
    const r = opts.userFindByPkReject;
    if (r instanceof Error) User.findByPk.mockRejectedValue(r);
    else
      User.findByPk.mockImplementation(() => {
        throw r;
      });
  } else {
    User.findByPk
      .mockResolvedValueOnce(firstUser)
      .mockResolvedValueOnce(secondUser);
  }

  vi.doMock(modelsUrl, () => ({ User, Role }));

  const mod = await import(controllerUrl);
  const controllerAdminUpdateRole = mod.default;

  type Handler = typeof controllerAdminUpdateRole;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (data?: {
    params?: unknown;
    body?: unknown;
    user?: unknown;
  }): ReqT =>
    ({
      params: data?.params ?? {},
      body: data?.body ?? {},
      user: data?.user,
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerAdminUpdateRole,
    makeReq,
    makeTypedRes,
    mocks: { User, Role, userUpdate },
  };
}

describe("controller admin updateRole", () => {
  it("retourne 400 si userID ou roleID est invalide", async () => {
    const { controllerAdminUpdateRole, makeReq, makeTypedRes } = await load();

    const req = makeReq({ params: { userID: "x" }, body: { roleID: "y" } });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "userID and roleID are required",
    });
  });

  it("retourne 400 si userID est fourni sous forme de tableau vide", async () => {
    const { controllerAdminUpdateRole, makeReq, makeTypedRes } = await load();

    const req = makeReq({ params: { userID: [] }, body: { roleID: "2" } });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "userID and roleID are required",
    });
  });

  it("retourne 404 si le rôle est introuvable", async () => {
    const { controllerAdminUpdateRole, makeReq, makeTypedRes, mocks } =
      await load({
        roleFindByPkResult: null,
      });

    const req = makeReq({ params: { userID: "7" }, body: { roleID: "2" } });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(mocks.Role.findByPk).toHaveBeenCalledWith(2);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Role not found",
    });
  });

  it("retourne 404 si l’utilisateur est introuvable", async () => {
    const { controllerAdminUpdateRole, makeReq, makeTypedRes, mocks } =
      await load({
        userFindByPkFirstResult: null,
      });

    const req = makeReq({ params: { userID: "7" }, body: { roleID: "2" } });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "User not found",
    });
  });

  it("retourne 403 en cas de tentative de modification de son propre rôle", async () => {
    const { controllerAdminUpdateRole, makeReq, makeTypedRes, mocks } =
      await load({
        userFindByPkFirstResult: {
          userID: 7,
          update: vi.fn().mockResolvedValue(undefined),
        },
      });

    const req = makeReq({
      params: { userID: "7" },
      body: { roleID: "2" },
      user: { userID: 7 },
    });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      code: "FORBIDDEN",
      message: "Cannot modify your own role",
    });
  });

  it("retourne 200 avec l’utilisateur mis à jour", async () => {
    const userUpdate = vi.fn().mockResolvedValue(undefined);

    const { controllerAdminUpdateRole, makeReq, makeTypedRes, mocks } =
      await load({
        userFindByPkFirstResult: { userID: 7, update: userUpdate },
        userFindByPkSecondResult: {
          userID: 7,
          nickname: "Neo",
          email: "neo@matrix.tld",
          roleID: 2,
          isVerified: true,
          role: { roleID: 2, roleLabel: "admin" },
        },
      });

    const req = makeReq({
      params: { userID: "7" },
      body: { roleID: 2 },
      user: { userID: 99 },
    });
    const { res, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(mocks.Role.findByPk).toHaveBeenCalledWith(2);
    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(userUpdate).toHaveBeenCalledWith({ roleID: 2 });
    expect(json).toHaveBeenCalledWith({
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      roleID: 2,
      roleLabel: "admin",
      isVerified: true,
    });
  });

  it("retourne 200 si userID et roleID sont fournis sous forme de tableaux", async () => {
    const userUpdate = vi.fn().mockResolvedValue(undefined);

    const { controllerAdminUpdateRole, makeReq, makeTypedRes, mocks } =
      await load({
        userFindByPkFirstResult: { userID: 7, update: userUpdate },
        userFindByPkSecondResult: {
          userID: 7,
          nickname: "Neo",
          email: "neo@matrix.tld",
          roleID: 2,
          isVerified: true,
          role: { roleID: 2, roleLabel: "admin" },
        },
      });

    const req = makeReq({
      params: { userID: ["7"] },
      body: { roleID: ["2"] },
      user: { userID: 99 },
    });
    const { res, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(mocks.Role.findByPk).toHaveBeenCalledWith(2);
    expect(mocks.User.findByPk).toHaveBeenCalledWith(7);
    expect(userUpdate).toHaveBeenCalledWith({ roleID: 2 });
    expect(json).toHaveBeenCalledWith({
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      roleID: 2,
      roleLabel: "admin",
      isVerified: true,
    });
  });

  it("retourne 200 avec roleLabel à 'guest' par défaut si roleLabel est absent", async () => {
    const userUpdate = vi.fn().mockResolvedValue(undefined);

    const { controllerAdminUpdateRole, makeReq, makeTypedRes } = await load({
      userFindByPkFirstResult: { userID: 7, update: userUpdate },
      userFindByPkSecondResult: {
        userID: 7,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 2,
        isVerified: true,
        role: { roleID: 2 },
      },
    });

    const req = makeReq({
      params: { userID: "7" },
      body: { roleID: "2" },
      user: { userID: 99 },
    });
    const { res, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(userUpdate).toHaveBeenCalledWith({ roleID: 2 });
    expect(json).toHaveBeenCalledWith({
      userID: 7,
      nickname: "Neo",
      email: "neo@matrix.tld",
      roleID: 2,
      roleLabel: "guest",
      isVerified: true,
    });
  });

  it("retourne 404 si le rechargement de l’utilisateur échoue ou si son rôle est absent", async () => {
    const userUpdate = vi.fn().mockResolvedValue(undefined);

    const { controllerAdminUpdateRole, makeReq, makeTypedRes } = await load({
      userFindByPkFirstResult: { userID: 7, update: userUpdate },
      userFindByPkSecondResult: null,
    });

    const req = makeReq({
      params: { userID: "7" },
      body: { roleID: "2" },
      user: { userID: 99 },
    });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "User not found",
    });
  });

  it("retourne 500 avec le message de l’erreur si une Error est levée", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerAdminUpdateRole, makeReq, makeTypedRes } = await load({
      roleFindByPkReject: new Error("boom"),
    });

    const req = makeReq({ params: { userID: "7" }, body: { roleID: "2" } });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("retourne 500 avec un message serveur générique si l’erreur n’est pas une Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerAdminUpdateRole, makeReq, makeTypedRes } = await load({
      roleFindByPkReject: "nope",
    });

    const req = makeReq({ params: { userID: "7" }, body: { roleID: "2" } });
    const { res, status, json } = makeTypedRes();

    await controllerAdminUpdateRole(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
