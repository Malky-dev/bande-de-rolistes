import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/rpg/updateTable.ts"),
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

  hasRole?: boolean;
  tableFound?: boolean;
  dungeonMasterID?: number;

  saveReject?: unknown;
  findReject?: unknown;
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
          save: tableSave,
        } as unknown as Record<string, unknown>);

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
  const controllerUpdateTable = mod.default;

  type Handler = typeof controllerUpdateTable;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (eventID: string, body?: Record<string, unknown>): ReqT =>
    ({
      params: { eventID },
      body: body ?? {},
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
    controllerUpdateTable,
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

describe("controller updateTable", () => {
  it("retourne 400 si eventID est invalide", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      eventIDParsed: null,
    });

    const req = makeReq("abc");
    const { res } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "eventID invalide",
    );
    expect(mocks.TableRPG.findByPk).not.toHaveBeenCalled();
  });

  it("retourne 401 si l’utilisateur n’est pas authentifié", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes } = await load({
      userID: null,
      roleID: 3,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("retourne 401 si roleID n’est pas un nombre", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes } = await load({
      userID: 7,
      roleID: "3",
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("retourne 404 si la table est introuvable", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      tableFound: false,
      userID: 7,
      roleID: 3,
    });

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(7);
    expect(mocks.notFound).toHaveBeenCalledWith(
      expect.anything(),
      "Table introuvable",
    );
  });

  it("retourne 403 si l’utilisateur n’est ni admin ou organisateur, ni propriétaire de la table", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: false,
      userID: 7,
      roleID: 3,
      dungeonMasterID: 999,
    });

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.hasRole).toHaveBeenCalledWith(expect.anything(), [1, 2]);
    expect(mocks.forbid).toHaveBeenCalledWith(
      expect.anything(),
      "Accès refusé",
    );
    expect(mocks.tableSave).not.toHaveBeenCalled();
  });

  it("retourne 400 si eventDate est invalide", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: true,
      userID: 7,
      roleID: 1,
    });

    const req = makeReq("7", { eventDate: "nope" });
    const { res } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "eventDate invalide",
    );
    expect(mocks.tableSave).not.toHaveBeenCalled();
  });

  it("retourne 400 si location est invalide", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: true,
      userID: 7,
      roleID: 1,
    });

    const req = makeReq("7", { location: "a" });
    const { res } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "location invalide",
    );
    expect(mocks.tableSave).not.toHaveBeenCalled();
  });

  it("retourne 400 si game est invalide", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: true,
      userID: 7,
      roleID: 1,
    });

    const req = makeReq("7", { game: "a" });
    const { res } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "game invalide",
    );
    expect(mocks.tableSave).not.toHaveBeenCalled();
  });

  it("retourne 400 si maxPlayers est hors limites", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: true,
      userID: 7,
      roleID: 1,
    });

    const req = makeReq("7", { maxPlayers: 11 });
    const { res } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "maxPlayers doit être entre 1 et 10",
    );
    expect(mocks.tableSave).not.toHaveBeenCalled();
  });

  it("retourne 200 si le maître du jeu propriétaire met à jour les champs, arrondit maxPlayers à l’entier inférieur et force comments à null", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: false,
      userID: 7,
      roleID: 3,
      dungeonMasterID: 7,
    });

    const req = makeReq("7", {
      eventDate: "2026-01-02T00:00:00.000Z",
      location: "  Paris  ",
      game: "  D&D  ",
      comments: null,
      maxPlayers: 6.9,
    });
    const { res, json } = makeTypedRes();

    await controllerUpdateTable(req, res);

    const t = (mocks.TableRPG.findByPk.mock.results[0]?.value ??
      null) as unknown;
    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(7);
    expect(mocks.tableSave).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({ message: "Table mise à jour" });

    const tableObj = (await Promise.resolve(t)) as unknown as Record<
      string,
      unknown
    >;
    expect(tableObj["location"]).toBe("Paris");
    expect(tableObj["game"]).toBe("D&D");
    expect(tableObj["comments"]).toBeNull();
    expect(tableObj["maxPlayers"]).toBe(6);
    expect(tableObj["eventDate"]).toBeInstanceOf(Date);
  });

  it("retourne 200 si un admin ou un organisateur met à jour la table sans en être propriétaire", async () => {
    const { controllerUpdateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: true,
      userID: 7,
      roleID: 1,
      dungeonMasterID: 999,
    });

    const req = makeReq("7", { comments: "hello" });
    const { res, json } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(mocks.hasRole).toHaveBeenCalledWith(expect.anything(), [1, 2]);
    expect(mocks.tableSave).toHaveBeenCalled();
    expect(json).toHaveBeenCalledWith({ message: "Table mise à jour" });
  });

  it("retourne 500 avec le message de l’erreur si une Error est levée", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdateTable, makeReq, makeTypedRes } = await load({
      findReject: new Error("boom"),
      userID: 7,
      roleID: 3,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("retourne 500 avec un message serveur générique si l’erreur n’est pas une Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdateTable, makeReq, makeTypedRes } = await load({
      hasRole: true,
      userID: 7,
      roleID: 1,
      saveReject: "nope",
    });

    const req = makeReq("7", { comments: "hello" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
