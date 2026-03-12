import path from "node:path";
import { pathToFileURL } from "node:url";
import { Op } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/rpg/listTables.ts"),
).href;

const modelsUrl = new URL("../../models", controllerUrl).href;

const makeRes = <TRes>() => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as Record<string, unknown>;
  const res = resObj as unknown as TRes;
  return { res, status, json };
};

const makeRow = (value: unknown) => ({
  toJSON: () => value,
});

async function load(opts?: {
  findAllResult?: unknown;
  findAllReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const User = {};

  const TableRPG = {
    findAll: vi.fn(),
  };

  if (opts && "findAllReject" in opts && opts.findAllReject !== undefined) {
    const r = opts.findAllReject;
    if (r instanceof Error) TableRPG.findAll.mockRejectedValue(r);
    else
      TableRPG.findAll.mockImplementation(() => {
        throw r;
      });
  } else if (opts && "findAllResult" in opts) {
    TableRPG.findAll.mockResolvedValue(opts.findAllResult);
  } else {
    TableRPG.findAll.mockResolvedValue([]);
  }

  vi.doMock(modelsUrl, () => ({ TableRPG, User }));

  const mod = await import(controllerUrl);
  const controllerListTables = mod.default;

  type Handler = typeof controllerListTables;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (): ReqT =>
    ({ params: {}, body: {}, query: {} }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerListTables,
    makeReq,
    makeTypedRes,
    mocks: { TableRPG, User },
  };
}

describe("controller listTables", () => {
  it("retourne 200 avec les bons paramètres findAll et une liste mappée correctement", async () => {
    const rows = [
      makeRow({
        eventID: 7,
        eventDate: new Date("2026-01-01T00:00:00.000Z"),
        dungeonMaster: { userID: 1, nickname: "DM" },
        location: "Paris",
        game: "D&D",
        comments: 123,
        status: "OPEN",
        maxPlayers: 10.9,
      }),
      makeRow({
        eventID: 8,
        eventDate: "2026-01-02T00:00:00.000Z",
        dungeonMaster: { userID: 2, nickname: "MJ" },
        location: "Lyon",
        game: "Cthulhu",
        comments: "hello",
        status: "CLOSED",
        maxPlayers: 6.1,
      }),
      makeRow({
        eventID: 9,
        eventDate: 1700000000000,
        dungeonMaster: { userID: 3, nickname: "GM" },
        location: "Nice",
        game: "PF2",
        comments: null,
        status: "CANCELLED",
        maxPlayers: 1,
      }),
    ];

    const { controllerListTables, makeReq, makeTypedRes, mocks } = await load({
      findAllResult: rows,
    });

    const req = makeReq();
    const { res, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(mocks.TableRPG.findAll).toHaveBeenCalledTimes(1);

    const callArg = mocks.TableRPG.findAll.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;
    const where = callArg.where as Record<string, unknown>;
    const eventDate = where.eventDate as unknown as object;
    expect(Reflect.get(eventDate, Op.gte) as unknown).toBeInstanceOf(Date);

    expect(callArg.order).toEqual([["eventDate", "ASC"]]);

    const include = callArg.include as unknown[];
    expect(Array.isArray(include)).toBe(true);

    expect(json).toHaveBeenCalledWith([
      {
        eventID: 7,
        eventDate: "2026-01-01T00:00:00.000Z",
        dungeonMaster: { userID: 1, nickname: "DM" },
        location: "Paris",
        game: "D&D",
        comments: null,
        status: "OPEN",
        maxPlayers: 10,
      },
      {
        eventID: 8,
        eventDate: "2026-01-02T00:00:00.000Z",
        dungeonMaster: { userID: 2, nickname: "MJ" },
        location: "Lyon",
        game: "Cthulhu",
        comments: "hello",
        status: "CLOSED",
        maxPlayers: 6,
      },
      {
        eventID: 9,
        eventDate: new Date(1700000000000).toISOString(),
        dungeonMaster: { userID: 3, nickname: "GM" },
        location: "Nice",
        game: "PF2",
        comments: null,
        status: "CANCELLED",
        maxPlayers: 1,
      },
    ]);
  });

  it("retourne 500 si row.toJSON ne renvoie pas un objet exploitable", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [makeRow("nope")],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "TableRPG invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si eventID est invalide", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: "7",
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "eventID invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si eventDate est invalide avec une Date NaN", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: new Date("invalid"),
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "eventDate invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si eventDate est invalide avec une valeur de type objet", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: {},
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "eventDate invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si eventDate est invalide sous forme de chaîne", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "not-a-date",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "eventDate invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si location est invalide", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: 1,
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "location invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si game est invalide", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: 1,
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "game invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si status est invalide", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "BROKEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "status invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si maxPlayers est invalide car non fini", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: Number.POSITIVE_INFINITY,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "maxPlayers invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si dungeonMaster est invalide car ce n’est pas un objet exploitable", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: "nope",
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "dungeonMaster invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si dungeonMaster.userID est invalide", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: { userID: "1", nickname: "DM" },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "dungeonMaster.userID invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 si dungeonMaster.nickname est invalide", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllResult: [
        makeRow({
          eventID: 7,
          eventDate: "2026-01-01T00:00:00.000Z",
          dungeonMaster: { userID: 1, nickname: 2 },
          location: "Paris",
          game: "D&D",
          comments: null,
          status: "OPEN",
          maxPlayers: 10,
        }),
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "dungeonMaster.nickname invalide",
    });

    errSpy.mockRestore();
  });

  it("retourne 500 avec le message de l’erreur si findAll lève une Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllReject: new Error("boom"),
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });

  it("retourne 500 avec un message serveur générique si l’erreur n’est pas une Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListTables, makeReq, makeTypedRes } = await load({
      findAllReject: "nope",
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListTables(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });
});
