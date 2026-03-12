import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/rpg/createTable.ts"),
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
  roleID?: unknown;
  dmFindResult?: unknown;
  createResult?: unknown;
  createReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Role = {};
  const TableRPG = {
    create: vi.fn(),
  };
  const User = {
    findByPk: vi.fn(),
  };

  if (opts && "dmFindResult" in opts) {
    User.findByPk.mockResolvedValue(opts.dmFindResult);
  } else {
    User.findByPk.mockResolvedValue({
      toJSON: () => ({ role: { roleID: 1 } }),
    });
  }

  if (opts && "createReject" in opts && opts.createReject !== undefined) {
    const r = opts.createReject;
    if (r instanceof Error) TableRPG.create.mockRejectedValue(r);
    else
      TableRPG.create.mockImplementation(() => {
        throw r;
      });
  } else {
    TableRPG.create.mockResolvedValue(opts?.createResult ?? { eventID: 42 });
  }

  const hasRole = vi.fn().mockReturnValue(opts?.hasRole ?? true);
  const getUserID = vi
    .fn()
    .mockReturnValue(opts && "userID" in opts ? opts.userID : 7);
  const forbid = vi.fn((res: unknown) => res);
  const badRequest = vi.fn((res: unknown) => res);

  vi.doMock(modelsUrl, () => ({ Role, TableRPG, User }));
  vi.doMock(helpersUrl, () => ({ hasRole, getUserID, forbid, badRequest }));

  const mod = await import(controllerUrl);
  const controllerCreateTable = mod.default;

  type Handler = typeof controllerCreateTable;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (data?: { body?: unknown; user?: unknown }): ReqT =>
    ({
      body: data?.body ?? {},
      user:
        data?.user ??
        (opts && "roleID" in opts
          ? { role: { roleID: opts.roleID } }
          : { role: { roleID: 1 } }),
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerCreateTable,
    makeReq,
    makeTypedRes,
    mocks: { Role, TableRPG, User, hasRole, getUserID, forbid, badRequest },
  };
}

describe("controllerCreateTable", () => {
  it("403 si pas le rôle", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } = await load({
      hasRole: false,
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      },
    });
    const { res } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
    expect(mocks.TableRPG.create).not.toHaveBeenCalled();
  });

  it("401 si pas authentifié (getUserID falsy)", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      userID: null,
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("400 si eventDate pas string", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq({
      body: { eventDate: 123, location: "Paris", game: "D&D" },
    });
    const { res } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "eventDate requis (ISO string)",
    );
  });

  it("400 si eventDate invalide", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq({
      body: { eventDate: "nope", location: "Paris", game: "D&D" },
    });
    const { res } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "eventDate invalide",
    );
  });

  it("400 si location invalide", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "a",
        game: "D&D",
      },
    });
    const { res } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "location invalide",
    );
  });

  it("400 si game invalide", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "a",
      },
    });
    const { res } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "game invalide",
    );
  });

  it("401 si req.user.role.roleID absent", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      roleID: undefined,
    });

    const req = makeReq({
      user: {},
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      code: "UNAUTHORIZED",
      message: "Not authenticated",
    });
  });

  it("400 si admin/orga sans dungeonMasterUserID", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } = await load({
      roleID: 4,
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      },
    });
    const { res } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "dungeonMasterUserID requis",
    );
  });

  it("400 si DM introuvable", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      roleID: 4,
      dmFindResult: null,
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMasterUserID: 123,
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le MJ doit avoir un rôle 1, 2 ou 3",
    });
  });

  it("400 si DM rôle invalide", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      roleID: 4,
      dmFindResult: { toJSON: () => ({ role: { roleID: 9 } }) },
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMasterUserID: 123,
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le MJ doit avoir un rôle 1, 2 ou 3",
    });
  });

  it("400 si le JSON du DM n'est pas un record", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      roleID: 4,
      dmFindResult: { toJSON: () => "bad-shape" },
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMasterUserID: 123,
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le MJ doit avoir un rôle 1, 2 ou 3",
    });
  });

  it("400 si le JSON du DM ne contient pas un Role record", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      roleID: 4,
      dmFindResult: { toJSON: () => ({ role: "bad-shape" }) },
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMasterUserID: 123,
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le MJ doit avoir un rôle 1, 2 ou 3",
    });
  });

  it("400 si le roleID du DM n'est pas un number", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      roleID: 4,
      dmFindResult: { toJSON: () => ({ role: { roleID: "1" } }) },
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMasterUserID: 123,
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le MJ doit avoir un rôle 1, 2 ou 3",
    });
  });

  it("400 si maxPlayers hors limites", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } = await load({
      roleID: 1,
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
        maxPlayers: 11,
      },
    });
    const { res } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "maxPlayers doit être entre 1 et 10",
    );
  });

  it("201 si ok (role <= 3 => dm = userID) + maxPlayers default 10", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } = await load({
      roleID: 2,
      userID: 7,
      createResult: { eventID: 99 },
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "  Paris  ",
        game: "  D&D  ",
        comments: undefined,
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.User.findByPk).toHaveBeenCalledWith(7, {
      include: [{ model: mocks.Role, as: "role", required: true }],
    });

    expect(mocks.TableRPG.create).toHaveBeenCalledWith({
      eventDate: new Date("2026-01-01T00:00:00.000Z"),
      dungeon_master: 7,
      location: "Paris",
      game: "D&D",
      comments: null,
      status: "OPEN",
      maxPlayers: 10,
    });

    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ eventID: 99, message: "Table créée" });
  });

  it("201 si comments est une string et maxPlayers est arrondi", async () => {
    const { controllerCreateTable, makeReq, makeTypedRes, mocks } = await load({
      roleID: 4,
      createResult: { eventID: 100 },
      dmFindResult: { toJSON: () => ({ role: { roleID: 2 } }) },
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMasterUserID: 123,
        location: "  Paris  ",
        game: "  D&D  ",
        comments: "Bring dice",
        maxPlayers: 6.8,
      },
      user: { role: { roleID: 4 } },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(mocks.TableRPG.create).toHaveBeenCalledWith({
      eventDate: new Date("2026-01-01T00:00:00.000Z"),
      dungeon_master: 123,
      location: "Paris",
      game: "D&D",
      comments: "Bring dice",
      status: "OPEN",
      maxPlayers: 6,
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({ eventID: 100, message: "Table créée" });
  });

  it("500 si erreur Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      createReject: new Error("boom"),
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "boom",
    });

    errSpy.mockRestore();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerCreateTable, makeReq, makeTypedRes } = await load({
      createReject: "nope",
    });

    const req = makeReq({
      body: {
        eventDate: "2026-01-01T00:00:00.000Z",
        location: "Paris",
        game: "D&D",
      },
    });
    const { res, status, json } = makeTypedRes();

    await controllerCreateTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
