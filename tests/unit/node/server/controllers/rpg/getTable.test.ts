import { describe, it, expect, vi } from "vitest";
import path from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/rpg/getTable.ts"),
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

const makeTable = (value: unknown) => ({
  toJSON: () => value,
});

const makeSignup = (value: unknown) => ({
  toJSON: () => value,
});

async function load(opts?: {
  parseEventID?: number | null;

  tableFindResult?: unknown;
  tableFindReject?: unknown;

  signupsFindResult?: unknown;
  signupsFindReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const User = {};

  const TableRPG = {
    findByPk: vi.fn(),
  };

  const TableRPGPlayer = {
    findAll: vi.fn(),
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
    "signupsFindReject" in opts &&
    opts.signupsFindReject !== undefined
  ) {
    const r = opts.signupsFindReject;
    if (r instanceof Error) TableRPGPlayer.findAll.mockRejectedValue(r);
    else
      TableRPGPlayer.findAll.mockImplementation(() => {
        throw r;
      });
  } else if (opts && "signupsFindResult" in opts) {
    TableRPGPlayer.findAll.mockResolvedValue(opts.signupsFindResult);
  } else {
    TableRPGPlayer.findAll.mockResolvedValue([]);
  }

  const parseIntParam = vi
    .fn()
    .mockReturnValue(opts && "parseEventID" in opts ? opts.parseEventID : 7);
  const notFound = vi.fn();

  vi.doMock(modelsUrl, () => ({ TableRPG, TableRPGPlayer, User }));
  vi.doMock(helpersUrl, () => ({ parseIntParam, notFound }));

  const mod = await import(controllerUrl);
  const controllerGetTable = mod.default;

  type Handler = typeof controllerGetTable;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (eventID: string): ReqT =>
    ({ params: { eventID }, body: {}, query: {} }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerGetTable,
    makeReq,
    makeTypedRes,
    mocks: { TableRPG, TableRPGPlayer, User, parseIntParam, notFound },
  };
}

describe("controllerGetTable", () => {
  it("400 si eventID invalide", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      parseEventID: null,
    });

    const req = makeReq("abc");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "eventID invalide",
    });
  });

  it("404 si table introuvable", async () => {
    const { controllerGetTable, makeReq, makeTypedRes, mocks } = await load({
      tableFindResult: null,
    });

    const req = makeReq("7");
    const { res } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(mocks.notFound).toHaveBeenCalledWith(
      expect.anything(),
      "Table introuvable",
    );
  });

  it("500 si table.toJSON pas record", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable("nope"),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Table invalide",
    });
  });

  it("500 si dungeonMaster pas record", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({ dungeonMaster: "nope" }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "MJ invalide",
    });
  });

  it("500 si dungeonMaster userID/nickname invalides", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: "7", nickname: 123 },
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "MJ invalide",
    });
  });

  it("500 si eventDate invalide (Date NaN)", async () => {
    const badDate = new Date("invalid");
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 1, nickname: "DM" },
        eventDate: badDate,
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "eventDate invalide",
    });
  });

  it("500 si eventDate invalide (string)", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 1, nickname: "DM" },
        eventDate: "not-a-date",
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "eventDate invalide",
    });
  });

  it("500 si eventID invalide dans table JSON", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 1, nickname: "DM" },
        eventDate: "2026-01-01T00:00:00.000Z",
        eventID: "7",
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "eventID invalide",
    });
  });

  it("500 si location/game invalides", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 1, nickname: "DM" },
        eventDate: "2026-01-01T00:00:00.000Z",
        eventID: 7,
        location: 123,
        game: "D&D",
        status: "OPEN",
        maxPlayers: 6,
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Table invalide",
    });
  });

  it("500 si status invalide", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 1, nickname: "DM" },
        eventDate: "2026-01-01T00:00:00.000Z",
        eventID: 7,
        location: "Paris",
        game: "D&D",
        status: "BROKEN",
        maxPlayers: 6,
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "status invalide",
    });
  });

  it("500 si maxPlayers invalide (non-finie)", async () => {
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 1, nickname: "DM" },
        eventDate: "2026-01-01T00:00:00.000Z",
        eventID: 7,
        location: "Paris",
        game: "D&D",
        status: "OPEN",
        maxPlayers: Number.POSITIVE_INFINITY,
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "maxPlayers invalide",
    });
  });

  it("200: map signups (continue paths), cap=6, waitlist, comments string", async () => {
    const signups = [
      makeSignup("bad"),
      makeSignup({}),
      makeSignup({
        user: { userID: "1", nickname: "A" },
        created_at: "2026-01-01T00:00:00.000Z",
      }),
      makeSignup({ user: { userID: 1, nickname: "A" }, created_at: {} }),
      makeSignup({
        user: { userID: 1, nickname: "A" },
        created_at: 1700000000000,
      }),
      makeSignup({
        user: { userID: 2, nickname: "B" },
        created_at: "2026-01-01T00:00:01.000Z",
      }),
      makeSignup({
        user: { userID: 3, nickname: "C" },
        created_at: "2026-01-01T00:00:02.000Z",
      }),
      makeSignup({
        user: { userID: 4, nickname: "D" },
        created_at: "2026-01-01T00:00:03.000Z",
      }),
      makeSignup({
        user: { userID: 5, nickname: "E" },
        created_at: "2026-01-01T00:00:04.000Z",
      }),
      makeSignup({
        user: { userID: 6, nickname: "F" },
        created_at: "2026-01-01T00:00:05.000Z",
      }),
      makeSignup({
        user: { userID: 7, nickname: "G" },
        created_at: "2026-01-01T00:00:06.000Z",
      }),
    ];

    const { controllerGetTable, makeReq, makeTypedRes, mocks } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 9, nickname: "DM" },
        eventDate: new Date("2026-01-01T00:00:00.000Z"),
        eventID: 7,
        location: "Paris",
        game: "D&D",
        comments: "hello",
        status: "OPEN",
        maxPlayers: 10.7,
      }),
      signupsFindResult: signups,
    });

    const req = makeReq("7");
    const { res, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(mocks.TableRPGPlayer.findAll).toHaveBeenCalled();

    const payload = (json.mock.calls[0]?.[0] ?? null) as unknown as Record<
      string,
      unknown
    >;
    expect(payload["eventID"]).toBe(7);
    expect(payload["comments"]).toBe("hello");
    expect(payload["maxPlayers"]).toBe(10);
    expect(payload["confirmedCap"]).toBe(6);

    const confirmed = payload["confirmed"] as unknown[];
    const waitlist = payload["waitlist"] as unknown[];

    expect(confirmed.length).toBe(6);
    expect(waitlist.length).toBe(1);

    const lastWait = waitlist[0] as Record<string, unknown>;
    expect(lastWait.userID).toBe(7);
  });

  it("200: comments null et cap basé sur maxPlayers", async () => {
    const signups = [
      makeSignup({
        user: { userID: 1, nickname: "A" },
        created_at: "2026-01-01T00:00:00.000Z",
      }),
      makeSignup({
        user: { userID: 2, nickname: "B" },
        created_at: "2026-01-01T00:00:01.000Z",
      }),
      makeSignup({
        user: { userID: 3, nickname: "C" },
        created_at: "2026-01-01T00:00:02.000Z",
      }),
      makeSignup({
        user: { userID: 4, nickname: "D" },
        created_at: "2026-01-01T00:00:03.000Z",
      }),
    ];

    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 9, nickname: "DM" },
        eventDate: "2026-01-01T00:00:00.000Z",
        eventID: 7,
        location: "Paris",
        game: "D&D",
        comments: null,
        status: "OPEN",
        maxPlayers: 3.2,
      }),
      signupsFindResult: signups,
    });

    const req = makeReq("7");
    const { res, json } = makeTypedRes();

    await controllerGetTable(req, res);

    const payload = (json.mock.calls[0]?.[0] ?? null) as unknown as Record<
      string,
      unknown
    >;
    expect(payload["comments"]).toBeNull();
    expect(payload["confirmedCap"]).toBe(3);

    const confirmed = payload["confirmed"] as unknown[];
    const waitlist = payload["waitlist"] as unknown[];
    expect(confirmed.length).toBe(3);
    expect(waitlist.length).toBe(1);
  });

  it("200: comments non-string devient null", async () => {
    const signups = [
      makeSignup({
        user: { userID: 1, nickname: "A" },
        created_at: "2026-01-01T00:00:00.000Z",
      }),
    ];

    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindResult: makeTable({
        dungeonMaster: { userID: 9, nickname: "DM" },
        eventDate: "2026-01-01T00:00:00.000Z",
        eventID: 7,
        location: "Paris",
        game: "D&D",
        comments: 123,
        status: "OPEN",
        maxPlayers: 6,
      }),
      signupsFindResult: signups,
    });

    const req = makeReq("7");
    const { res, json } = makeTypedRes();

    await controllerGetTable(req, res);

    const payload = (json.mock.calls[0]?.[0] ?? null) as Record<
      string,
      unknown
    >;
    expect(payload.comments).toBeNull();
  });

  it("500 si erreur non-Error", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      tableFindReject: "nope",
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    errSpy.mockRestore();
  });

  it("500 si Error(message)", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerGetTable, makeReq, makeTypedRes } = await load({
      signupsFindReject: new Error("boom"),
      tableFindResult: makeTable({
        dungeonMaster: { userID: 9, nickname: "DM" },
        eventDate: "2026-01-01T00:00:00.000Z",
        eventID: 7,
        location: "Paris",
        game: "D&D",
        comments: null,
        status: "OPEN",
        maxPlayers: 6,
      }),
    });

    const req = makeReq("7");
    const { res, status, json } = makeTypedRes();

    await controllerGetTable(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });

    errSpy.mockRestore();
  });
});
