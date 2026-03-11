import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/admin/roles.ts"),
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

  const Role = {
    findAll: vi.fn(),
  };

  if (opts && "findAllReject" in opts && opts.findAllReject !== undefined) {
    const r = opts.findAllReject;
    if (r instanceof Error) Role.findAll.mockRejectedValue(r);
    else
      Role.findAll.mockImplementation(() => {
        throw r;
      });
  } else if (opts && "findAllResult" in opts) {
    Role.findAll.mockResolvedValue(opts.findAllResult);
  } else {
    Role.findAll.mockResolvedValue([]);
  }

  vi.doMock(modelsUrl, () => ({ Role }));

  const mod = await import(controllerUrl);
  const controllerAdminRoles = mod.default;

  type Handler = typeof controllerAdminRoles;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (): ReqT =>
    ({ params: {}, body: {}, query: {} }) as unknown as ReqT;
  const makeTypedRes = () => makeRes<ResT>();

  return { controllerAdminRoles, makeReq, makeTypedRes, mocks: { Role } };
}

describe("controllerAdminRoles", () => {
  it("200 json: liste des rôles (tri ASC)", async () => {
    const { controllerAdminRoles, makeReq, makeTypedRes, mocks } = await load({
      findAllResult: [
        { roleID: 2, roleLabel: "admin" },
        { roleID: 1, roleLabel: "user" },
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerAdminRoles(req, res);

    expect(mocks.Role.findAll).toHaveBeenCalledWith({
      order: [["roleID", "ASC"]],
    });
    expect(status).not.toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith([
      { roleID: 2, roleLabel: "admin" },
      { roleID: 1, roleLabel: "user" },
    ]);
  });

  it("500 si Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerAdminRoles, makeReq, makeTypedRes } = await load({
      findAllReject: new Error("boom"),
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerAdminRoles(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerAdminRoles, makeReq, makeTypedRes } = await load({
      findAllReject: "nope",
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerAdminRoles(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
