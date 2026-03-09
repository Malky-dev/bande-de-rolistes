import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/rpg/signup.ts"),
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

  tableFindResult?: unknown;
  tableFindReject?: unknown;

  playerCreateReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const TableRPG = {
    findByPk: vi.fn(),
  };

  const TableRPGPlayer = {
    create: vi.fn(),
  };

  if (opts && "tableFindReject" in opts && opts.tableFindReject !== undefined) {
    const r = opts.tableFindReject;
    if (r instanceof Error) TableRPG.findByPk.mockRejectedValue(r);
    else
      TableRPG.findByPk.mockImplementation(() => {
        throw r;
      });
  } else if (opts && "tableFindResult" in opts) {
    TableRPG.findByPk.mockResolvedValue(opts.tableFindResult);
  } else {
    TableRPG.findByPk.mockResolvedValue(null);
  }

  if (
    opts &&
    "playerCreateReject" in opts &&
    opts.playerCreateReject !== undefined
  ) {
    const r = opts.playerCreateReject;
    if (r instanceof Error) TableRPGPlayer.create.mockRejectedValue(r);
    else
      TableRPGPlayer.create.mockImplementation(() => {
        throw r;
      });
  } else {
    TableRPGPlayer.create.mockResolvedValue(undefined);
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
  const notFound = vi.fn();

  vi.doMock(modelsUrl, () => ({ TableRPG, TableRPGPlayer }));
  vi.doMock(helpersUrl, () => ({
    hasRole,
    getUserID,
    parseIntParam,
    forbid,
    badRequest,
    notFound,
  }));

  const mod = await import(controllerUrl);
  const controllerSignup = mod.default;

  type Handler = typeof controllerSignup;
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
    controllerSignup,
    makeReq,
    makeTypedRes,
    mocks: {
      TableRPG,
      TableRPGPlayer,
      hasRole,
      getUserID,
      parseIntParam,
      forbid,
      badRequest,
      notFound,
    },
  };
}

describe("controllerSignup", () => {
  it("403 si pas le rôle", async () => {
    const { controllerSignup, makeReq, makeTypedRes, mocks } = await load({
      hasRole: false,
    });

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerSignup(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
    expect(mocks.TableRPG.findByPk).not.toHaveBeenCalled();
    expect(mocks.TableRPGPlayer.create).not.toHaveBeenCalled();
  });

  it("401 si pas authentifié (getUserID falsy)", async () => {
    const { controllerSignup, makeReq, makeTypedRes } = await load({
      userID: null,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("400 si eventID invalide", async () => {
    const { controllerSignup, makeReq, makeTypedRes, mocks } = await load({
      eventIDParsed: null,
    });

    const req = makeReq("abc");
    const { res } = makeTypedRes();

    await controllerSignup(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "eventID invalide",
    );
    expect(mocks.TableRPG.findByPk).not.toHaveBeenCalled();
  });

  it("404 si table introuvable", async () => {
    const { controllerSignup, makeReq, makeTypedRes, mocks } = await load({
      tableFindResult: null,
    });

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerSignup(req, res);

    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(7);
    expect(mocks.notFound).toHaveBeenCalledWith(
      expect.anything(),
      "Table introuvable",
    );
  });

  it("403 si table pas OPEN", async () => {
    const { controllerSignup, makeReq, makeTypedRes, mocks } = await load({
      tableFindResult: { status: "CLOSED", dungeon_master: 99 },
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(7);
    expect(status).toHaveBeenCalledWith(403);
    expect(json).toHaveBeenCalledWith({
      code: "FORBIDDEN",
      message: "Inscriptions fermées",
    });
    expect(mocks.TableRPGPlayer.create).not.toHaveBeenCalled();
  });

  it("400 si MJ tente de s'inscrire", async () => {
    const { controllerSignup, makeReq, makeTypedRes, mocks } = await load({
      userID: 7,
      tableFindResult: { status: "OPEN", dungeon_master: 7 },
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(7);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le MJ ne peut pas être joueur sur sa table",
    });
    expect(mocks.TableRPGPlayer.create).not.toHaveBeenCalled();
  });

  it("201 si ok", async () => {
    const { controllerSignup, makeReq, makeTypedRes, mocks } = await load({
      userID: 7,
      eventIDParsed: 9,
      tableFindResult: { status: "OPEN", dungeon_master: 123 },
    });

    const req = makeReq("9");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(mocks.TableRPG.findByPk).toHaveBeenCalledWith(9);
    expect(mocks.TableRPGPlayer.create).toHaveBeenCalledWith({
      eventID: 9,
      userID: 7,
    });

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ message: "Inscription enregistrée" });
  });

  it("409 si SequelizeUniqueConstraintError", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const dup = new Error("dup");
    dup.name = "SequelizeUniqueConstraintError";

    const { controllerSignup, makeReq, makeTypedRes } = await load({
      tableFindResult: { status: "OPEN", dungeon_master: 123 },
      playerCreateReject: dup,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      code: "DUPLICATE",
      message: "Déjà inscrit",
    });

    errSpy.mockRestore();
  });

  it("400 si SequelizeForeignKeyConstraintError", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fk = new Error("fk");
    fk.name = "SequelizeForeignKeyConstraintError";

    const { controllerSignup, makeReq, makeTypedRes } = await load({
      tableFindResult: { status: "OPEN", dungeon_master: 123 },
      playerCreateReject: fk,
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "FOREIGN_KEY_ERROR",
      message: "Référence invalide",
    });

    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { controllerSignup, makeReq, makeTypedRes } = await load({
      tableFindResult: { status: "OPEN", dungeon_master: 123 },
      playerCreateReject: "nope",
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });

  it("500 si Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const { controllerSignup, makeReq, makeTypedRes } = await load({
      tableFindReject: new Error("boom"),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerSignup(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });
});
