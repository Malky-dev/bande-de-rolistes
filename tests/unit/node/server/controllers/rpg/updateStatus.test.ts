import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/rpg/updateStatus.ts"),
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
  eventIDParsed?: number | null;
  userID?: number | null;
  roleID?: unknown;
  status?: unknown;

  hasRole?: boolean;

  tableFound?: boolean;
  dungeonMasterID?: number;
  findReject?: unknown;
  saveReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const tableSave = vi.fn();

  if (opts && "saveReject" in opts && opts.saveReject !== undefined) {
    const r = opts.saveReject;
    if (r instanceof Error) tableSave.mockRejectedValue(r);
    else
      tableSave.mockImplementation(() => {
        throw r;
      });
  } else {
    tableSave.mockResolvedValue(undefined);
  }

  const table =
    opts?.tableFound === false
      ? null
      : ({
          dungeon_master: opts?.dungeonMasterID ?? 123,
          status: "OPEN",
          save: tableSave,
        } as unknown);

  const TableRPG = {
    findByPk: vi.fn(),
  };

  if (opts && "findReject" in opts && opts.findReject !== undefined) {
    const r = opts.findReject;
    if (r instanceof Error) TableRPG.findByPk.mockRejectedValue(r);
    else
      TableRPG.findByPk.mockImplementation(() => {
        throw r;
      });
  } else {
    TableRPG.findByPk.mockResolvedValue(table);
  }

  const parseIntParam = vi
    .fn()
    .mockReturnValue(opts && "eventIDParsed" in opts ? opts.eventIDParsed : 7);
  const getUserID = vi
    .fn()
    .mockReturnValue(opts && "userID" in opts ? opts.userID : 7);
  const hasRole = vi.fn().mockReturnValue(opts?.hasRole ?? false);

  const badRequest = vi.fn();
  const notFound = vi.fn();
  const forbid = vi.fn();

  vi.doMock(modelsUrl, () => ({ TableRPG }));
  vi.doMock(helpersUrl, () => ({
    parseIntParam,
    getUserID,
    hasRole,
    badRequest,
    notFound,
    forbid,
  }));

  const mod = await import(controllerUrl);
  const controllerUpdateStatus = mod.default;

  type Handler = typeof controllerUpdateStatus;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (eventID: string): ReqT =>
    ({
      params: { eventID },
      body: { status: opts && "status" in opts ? opts.status : "CLOSED" },
      query: {},
      user:
        opts && "roleID" in opts
          ? ({
              userID: 7,
              nickname: "Neo",
              role: { roleID: opts.roleID },
            } as unknown)
          : ({ userID: 7, nickname: "Neo", role: { roleID: 3 } } as unknown),
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerUpdateStatus,
    makeReq,
    makeTypedRes,
    mocks: {
      TableRPG,
      tableSave,
      parseIntParam,
      getUserID,
      hasRole,
      badRequest,
      notFound,
      forbid,
    },
  };
}

describe("controller updateStatus", () => {
  it("retourne 400 si eventID est invalide", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes, mocks } = await load(
      {
        eventIDParsed: null,
      },
    );

    const req = makeReq("abc");
    const { res } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "eventID invalide",
    );
    expect(mocks.TableRPG.findByPk).not.toHaveBeenCalled();
  });

  it("retourne 401 si l’utilisateur n’est pas authentifié", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes } = await load({
      userID: null,
      roleID: 3,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("retourne 401 si roleID n’est pas un nombre", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes } = await load({
      userID: 7,
      roleID: "3",
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("retourne 400 si status est invalide", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes, mocks } = await load(
      {
        status: "BROKEN",
      },
    );

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "status invalide",
    );
    expect(mocks.TableRPG.findByPk).not.toHaveBeenCalled();
  });

  it("retourne 404 si la table est introuvable", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes, mocks } = await load(
      {
        tableFound: false,
      },
    );

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(7);
    expect(mocks.notFound).toHaveBeenCalledWith(
      expect.anything(),
      "Table introuvable",
    );
  });

  it("retourne 403 si l’utilisateur n’est ni admin ou organisateur, ni propriétaire de la table", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes, mocks } = await load(
      {
        hasRole: false,
        userID: 7,
        dungeonMasterID: 999,
      },
    );

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(mocks.hasRole).toHaveBeenCalledWith(expect.anything(), [1, 2]);
    expect(mocks.forbid).toHaveBeenCalledWith(
      expect.anything(),
      "Accès refusé",
    );
    expect(mocks.tableSave).not.toHaveBeenCalled();
  });

  it("retourne 200 si le maître du jeu propriétaire met à jour le statut", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes, mocks } = await load(
      {
        hasRole: false,
        userID: 7,
        dungeonMasterID: 7,
        status: "CANCELLED",
      },
    );

    const req = makeReq("7");
    const { res, json } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(7);
    expect(mocks.tableSave).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({ message: "Statut mis à jour" });
  });

  it("retourne 200 si un admin ou un organisateur met à jour le statut", async () => {
    const { controllerUpdateStatus, makeReq, makeTypedRes, mocks } = await load(
      {
        hasRole: true,
        userID: 7,
        dungeonMasterID: 999,
        status: "CLOSED",
      },
    );

    const req = makeReq("7");
    const { res, json } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(mocks.hasRole).toHaveBeenCalledWith(expect.anything(), [1, 2]);
    expect(mocks.tableSave).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({ message: "Statut mis à jour" });
  });

  it("retourne 500 avec le message de l’erreur si une Error est levée", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdateStatus, makeReq, makeTypedRes } = await load({
      findReject: new Error("boom"),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("retourne 500 avec un message serveur générique si l’erreur n’est pas une Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdateStatus, makeReq, makeTypedRes } = await load({
      saveReject: "nope",
      hasRole: true,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUpdateStatus(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
