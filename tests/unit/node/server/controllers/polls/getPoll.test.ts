import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/getPoll.ts"),
).href;

const modelsUrl = pathToFileURL(
  path.join(root, "src/server/models/index.ts"),
).href;
const helpersUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/helpers.ts"),
).href;

const makeRes = <TRes>() => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as Record<string, unknown>;
  const res = resObj as unknown as TRes;
  return { res, status, json };
};

function makePoll(overrides?: Record<string, unknown>) {
  return {
    pollID: 1,
    title: "P1",
    description: "D1",
    endAt: new Date("2026-06-01T12:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    createdBy: 10,
    maxSelections: 1,
    isClosedManually: false,
    author: { userID: 10, nickname: "Alice" },
    options: [
      {
        optionID: 1,
        label: "A",
        displayOrder: 0,
        votes: [{ userID: 7, user: { userID: 7, nickname: "Bob" } }],
      },
      {
        optionID: 2,
        label: "B",
        displayOrder: 1,
        votes: [],
      },
    ],
    ...overrides,
  };
}

async function load(opts?: {
  parsePollID?: number | null;
  findByPkResult?: unknown;
  findByPkReject?: unknown;
  getUserID?: number | null;
  canManagePoll?: boolean;
  canVotePoll?: boolean;
  isPollClosed?: boolean;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Poll = { findByPk: vi.fn() };
  const PollOption = {};
  const PollVote = {};
  const User = {};

  if (opts?.findByPkReject !== undefined) {
    const r = opts.findByPkReject;
    if (r instanceof Error) Poll.findByPk.mockRejectedValue(r);
    else Poll.findByPk.mockImplementation(() => Promise.reject(r));
  } else {
    Poll.findByPk.mockResolvedValue(
      opts !== undefined && "findByPkResult" in opts
        ? opts.findByPkResult
        : makePoll(),
    );
  }

  const parseIntParam = vi
    .fn()
    .mockReturnValue(
      opts !== undefined && "parsePollID" in opts ? opts.parsePollID : 1,
    );
  type ResLike = {
    status: (n: number) => ResLike;
    json: (p: unknown) => ResLike;
  };
  const badRequest = vi.fn((res: ResLike, message: string) => {
    res.status(400).json({ code: "BAD_REQUEST", message });
    return res;
  });
  const notFound = vi.fn((res: ResLike, message: string) => {
    res.status(404).json({ code: "NOT_FOUND", message });
    return res;
  });
  const getUserID = vi
    .fn()
    .mockReturnValue(
      opts !== undefined && "getUserID" in opts ? opts.getUserID : 7,
    );
  const canManagePoll = vi.fn().mockReturnValue(opts?.canManagePoll ?? false);
  const canVotePoll = vi.fn().mockReturnValue(opts?.canVotePoll ?? true);
  const isPollClosed = vi.fn().mockReturnValue(opts?.isPollClosed ?? false);

  vi.doMock(modelsUrl, () => ({ Poll, PollOption, PollVote, User }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canManagePoll,
    canVotePoll,
    getUserID,
    isPollClosed,
    notFound,
    parseIntParam,
  }));

  const mod = await import(controllerUrl);
  const controllerGetPoll = mod.default;

  type Handler = typeof controllerGetPoll;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (pollID: string): ReqT =>
    ({ params: { pollID } }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerGetPoll,
    makeReq,
    makeTypedRes,
    mocks: {
      Poll,
      parseIntParam,
      badRequest,
      notFound,
      getUserID,
      canManagePoll,
      canVotePoll,
      isPollClosed,
    },
  };
}

describe("controller getPoll", () => {
  it("retourne 400 si pollID est invalide", async () => {
    const { controllerGetPoll, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 404 si le sondage est introuvable", async () => {
    const { controllerGetPoll, makeReq, makeTypedRes } = await load({
      findByPkResult: null,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Sondage non trouvé.",
    });
  });

  it("retourne 200 avec les détails du sondage et myVote pour l'utilisateur connecté", async () => {
    const { controllerGetPoll, makeReq, makeTypedRes } = await load({
      getUserID: 7,
      canManagePoll: true,
      canVotePoll: true,
      isPollClosed: false,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.pollID).toBe(1);
    expect(payload.title).toBe("P1");
    expect(payload.isClosed).toBe(false);
    expect(payload.canVote).toBe(true);
    expect(payload.canManage).toBe(true);
    expect(payload.myVote).toEqual([1]);
    const options = payload.options as Array<{
      optionID: number;
      label: string;
      voteCount: number;
      voters: Array<{ userID: number; nickname: string }>;
    }>;
    expect(options).toHaveLength(2);
    expect(options[0].voteCount).toBe(1);
    expect(options[0].voters[0]).toMatchObject({ userID: 7, nickname: "Bob" });
  });

  it("retourne 200 avec myVote vide quand l'utilisateur n'est pas connecté", async () => {
    const { controllerGetPoll, makeReq, makeTypedRes, mocks } = await load({
      getUserID: null,
      canManagePoll: false,
      canVotePoll: false,
      isPollClosed: false,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(mocks.getUserID).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.myVote).toEqual([]);
    expect(payload.canVote).toBe(false);
  });

  it("retourne 200 avec options vides et fallbacks author quand options/author manquants", async () => {
    const { controllerGetPoll, makeReq, makeTypedRes } = await load({
      findByPkResult: makePoll({
        options: undefined,
        author: undefined,
      }),
      getUserID: 7,
      isPollClosed: false,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.options).toEqual([]);
    expect(payload.createdBy).toMatchObject({
      userID: 10,
      nickname: "Utilisateur inconnu",
    });
  });

  it("retourne 200 avec vote sans user pour couvrir nickname fallback", async () => {
    const { controllerGetPoll, makeReq, makeTypedRes } = await load({
      findByPkResult: makePoll({
        options: [
          {
            optionID: 1,
            label: "A",
            displayOrder: 0,
            votes: [{ userID: 3, user: undefined }],
          },
        ],
      }),
      getUserID: 3,
      isPollClosed: false,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0]?.[0] as Record<string, unknown>;
    const options = payload.options as Array<{
      voters: Array<{ nickname: string }>;
    }>;
    expect(options[0].voters[0].nickname).toBe("Utilisateur inconnu");
  });

  it("retourne 200 avec option sans votes pour couvrir votes fallback", async () => {
    const { controllerGetPoll, makeReq, makeTypedRes } = await load({
      findByPkResult: makePoll({
        options: [
          {
            optionID: 1,
            label: "A",
            displayOrder: 0,
            votes: undefined,
          },
        ],
      }),
      getUserID: 7,
      isPollClosed: false,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0]?.[0] as Record<string, unknown>;
    const options = payload.options as Array<{
      voteCount: number;
      voters: unknown[];
    }>;
    expect(options[0].voteCount).toBe(0);
    expect(options[0].voters).toEqual([]);
  });

  it("retourne 500 avec message si findByPk échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerGetPoll, makeReq, makeTypedRes } = await load({
      findByPkReject: new Error("db error"),
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerGetPoll(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      message: "Impossible de récupérer le sondage.",
    });

    errSpy.mockRestore();
  });
});
