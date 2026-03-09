import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/rpg/unsignup.ts"),
).href;

const modelsUrl = new URL("../../models", controllerUrl).href;
const helpersUrl = new URL("./helpers", controllerUrl).href;

const makeRes = <TRes>() => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as Record<string, unknown>;
  const res = resObj as unknown as TRes;
  return { res, status, json };
};

async function load(opts?: {
  hasRole?: boolean;
  userID?: number | null;
  eventIDParsed?: number | null;
  destroyReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const TableRPGPlayer = {
    destroy: vi.fn(),
  };

  if (opts && "destroyReject" in opts && opts.destroyReject !== undefined) {
    const r = opts.destroyReject;
    if (r instanceof Error) TableRPGPlayer.destroy.mockRejectedValue(r);
    else
      TableRPGPlayer.destroy.mockImplementation(() => {
        throw r;
      });
  } else {
    TableRPGPlayer.destroy.mockResolvedValue(1);
  }

  const hasRole = vi.fn().mockReturnValue(opts?.hasRole ?? true);
  const getUserID = vi
    .fn()
    .mockReturnValue(opts && "userID" in opts ? opts.userID : 7);
  const parseIntParam = vi
    .fn()
    .mockReturnValue(opts && "eventIDParsed" in opts ? opts.eventIDParsed : 7);

  const forbid = vi.fn();
  const badRequest = vi.fn();

  vi.doMock(modelsUrl, () => ({ TableRPGPlayer }));
  vi.doMock(helpersUrl, () => ({
    hasRole,
    getUserID,
    parseIntParam,
    forbid,
    badRequest,
  }));

  const mod = await import(controllerUrl);
  const controllerUnsignup = mod.default;

  type Handler = typeof controllerUnsignup;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (eventID: string): ReqT =>
    ({
      params: { eventID },
      body: {},
      query: {},
      user: { userID: 7, nickname: "Neo", role: { roleID: 2 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerUnsignup,
    makeReq,
    makeTypedRes,
    mocks: {
      TableRPGPlayer,
      hasRole,
      getUserID,
      parseIntParam,
      forbid,
      badRequest,
    },
  };
}

describe("controllerUnsignup", () => {
  it("403 si pas le rôle", async () => {
    const { controllerUnsignup, makeReq, makeTypedRes, mocks } = await load({
      hasRole: false,
    });

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerUnsignup(req, res);

    expect(mocks.forbid).toHaveBeenCalledWith(
      expect.anything(),
      "Accès refusé",
    );
    expect(mocks.TableRPGPlayer.destroy).not.toHaveBeenCalled();
  });

  it("401 si pas authentifié (getUserID falsy)", async () => {
    const { controllerUnsignup, makeReq, makeTypedRes } = await load({
      userID: null,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUnsignup(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("400 si eventID invalide", async () => {
    const { controllerUnsignup, makeReq, makeTypedRes, mocks } = await load({
      eventIDParsed: null,
    });

    const req = makeReq("abc");
    const { res } = makeTypedRes();

    await controllerUnsignup(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "eventID invalide",
    );
    expect(mocks.TableRPGPlayer.destroy).not.toHaveBeenCalled();
  });

  it("200 json si ok (destroy appelé)", async () => {
    const { controllerUnsignup, makeReq, makeTypedRes, mocks } = await load({
      userID: 7,
      eventIDParsed: 9,
    });

    const req = makeReq("9");
    const { res, json } = makeTypedRes();

    await controllerUnsignup(req, res);

    expect(mocks.TableRPGPlayer.destroy).toHaveBeenCalledWith({
      where: { eventID: 9, userID: 7 },
    });
    expect(json).toHaveBeenCalledWith({ message: "Désinscription effectuée" });
  });

  it("500 si Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUnsignup, makeReq, makeTypedRes } = await load({
      destroyReject: new Error("boom"),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUnsignup(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUnsignup, makeReq, makeTypedRes } = await load({
      destroyReject: "nope",
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUnsignup(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
