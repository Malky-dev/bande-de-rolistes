import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/admin/users.ts"),
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
  findAllResult?: unknown;
  findAllReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Role = {};

  const User = {
    findAll: vi.fn(),
  };

  if (opts && "findAllReject" in opts && opts.findAllReject !== undefined) {
    const r = opts.findAllReject;
    if (r instanceof Error) User.findAll.mockRejectedValue(r);
    else
      User.findAll.mockImplementation(() => {
        throw r;
      });
  } else if (opts && "findAllResult" in opts) {
    User.findAll.mockResolvedValue(opts.findAllResult);
  } else {
    User.findAll.mockResolvedValue([]);
  }

  vi.doMock(modelsUrl, () => ({ User, Role }));

  const mod = await import(controllerUrl);
  const controllerAdminUsers = mod.default;

  type Handler = typeof controllerAdminUsers;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (): ReqT =>
    ({ params: {}, body: {}, query: {} }) as unknown as ReqT;
  const makeTypedRes = () => makeRes<ResT>();

  return { controllerAdminUsers, makeReq, makeTypedRes, mocks: { User, Role } };
}

describe("controllerAdminUsers", () => {
  it("200 json: liste mappée + tri nickname ASC + include role", async () => {
    const { controllerAdminUsers, makeReq, makeTypedRes, mocks } = await load({
      findAllResult: [
        {
          userID: 2,
          nickname: "Alice",
          email: "alice@tld",
          roleID: 1,
          role: { roleLabel: "member" },
          isVerified: false,
        },
        {
          userID: 7,
          nickname: "Neo",
          email: "neo@matrix.tld",
          roleID: 2,
          role: { roleLabel: "admin" },
          isVerified: true,
        },
      ],
    });

    const req = makeReq();
    const { res, json, status } = makeTypedRes();

    await controllerAdminUsers(req, res);

    expect(mocks.User.findAll).toHaveBeenCalledWith({
      include: { model: mocks.Role, as: "role", required: true },
      order: [["nickname", "ASC"]],
    });

    expect(status).not.toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith([
      {
        userID: 2,
        nickname: "Alice",
        email: "alice@tld",
        roleID: 1,
        roleLabel: "member",
        isVerified: false,
      },
      {
        userID: 7,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 2,
        roleLabel: "admin",
        isVerified: true,
      },
    ]);
  });

  it('200 json: role manquant => roleLabel "member"', async () => {
    const { controllerAdminUsers, makeReq, makeTypedRes } = await load({
      findAllResult: [
        {
          userID: 7,
          nickname: "Neo",
          email: "neo@matrix.tld",
          roleID: 2,
          role: undefined,
          isVerified: true,
        },
      ],
    });

    const req = makeReq();
    const { res, json } = makeTypedRes();

    await controllerAdminUsers(req, res);

    expect(json).toHaveBeenCalledWith([
      {
        userID: 7,
        nickname: "Neo",
        email: "neo@matrix.tld",
        roleID: 2,
        roleLabel: "member",
        isVerified: true,
      },
    ]);
  });

  it("500 si Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerAdminUsers, makeReq, makeTypedRes } = await load({
      findAllReject: new Error("boom"),
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerAdminUsers(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerAdminUsers, makeReq, makeTypedRes } = await load({
      findAllReject: "nope",
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerAdminUsers(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
