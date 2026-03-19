import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerPath = path.join(
  root,
  "src/server/controllers/polls/listPolls.ts",
);
const controllerUrl = pathToFileURL(controllerPath).href;

const modelsPath = path.join(root, "src/server/models/index.ts");
const helpersPath = path.join(root, "src/server/controllers/polls/helpers.ts");
const helpersUrl = pathToFileURL(helpersPath).href;

const makeRes = <TRes>() => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as Record<string, unknown>;
  const res = resObj as unknown as TRes;
  return { res, status, json };
};

async function load(opts?: {
  findAllResult?: unknown[];
  findAllReject?: unknown;
  isPollClosed?: boolean;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Poll = { findAll: vi.fn() };
  const PollVote = {};
  const User = {};

  if (opts?.findAllReject !== undefined) {
    const r = opts.findAllReject;
    if (r instanceof Error) Poll.findAll.mockRejectedValue(r);
    else Poll.findAll.mockImplementation(() => Promise.reject(r));
  } else {
    Poll.findAll.mockResolvedValue(
      opts?.findAllResult ?? [
        {
          pollID: 1,
          title: "P1",
          description: "D1",
          endAt: new Date("2026-06-01T12:00:00.000Z"),
          createdAt: new Date("2026-01-01T00:00:00.000Z"),
          createdBy: 10,
          maxSelections: 1,
          isClosedManually: false,
          author: { userID: 10, nickname: "Alice" },
          dataValues: {
            totalVoters: 5,
            totalVotes: 5,
          },
        },
      ],
    );
  }

  const isPollClosed = vi.fn().mockReturnValue(opts?.isPollClosed ?? false);
  const canManagePoll = vi.fn().mockReturnValue(false);

  vi.doMock(modelsPath, () => ({ Poll, PollVote, User }));
  vi.doMock(helpersUrl, () => ({ isPollClosed, canManagePoll }));

  const mod = await import(controllerUrl);
  const controllerListPolls = mod.default;

  type Handler = typeof controllerListPolls;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (): ReqT => ({}) as unknown as ReqT;
  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerListPolls,
    makeReq,
    makeTypedRes,
    mocks: { Poll, isPollClosed },
  };
}

describe("controller listPolls", () => {
  it("retourne 200 avec la liste des sondages mappés", async () => {
    const { controllerListPolls, makeReq, makeTypedRes } = await load();

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListPolls(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0]?.[0] as unknown[];
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({
      pollID: 1,
      title: "P1",
      description: "D1",
      endAt: "2026-06-01T12:00:00.000Z",
      createdBy: { userID: 10, nickname: "Alice" },
      maxSelections: 1,
      totalVoters: 5,
      totalVotes: 5,
      isClosed: false,
    });
  });

  it("retourne 200 avec isClosed true si isPollClosed retourne true", async () => {
    const { controllerListPolls, makeReq, makeTypedRes, mocks } = await load({
      isPollClosed: true,
    });

    const req = makeReq();
    const { res, json } = makeTypedRes();

    await controllerListPolls(req, res);

    const payload = json.mock.calls[0]?.[0] as unknown[];
    expect(payload[0]).toMatchObject({ isClosed: true });
    expect(mocks.isPollClosed).toHaveBeenCalled();
  });

  it("retourne 200 avec fallbacks author et dataValues quand manquants", async () => {
    const { controllerListPolls, makeReq, makeTypedRes } = await load({
      findAllResult: [
        {
          pollID: 2,
          title: "P2",
          description: null,
          endAt: new Date("2026-07-01T12:00:00.000Z"),
          createdAt: new Date("2026-02-01T00:00:00.000Z"),
          createdBy: 99,
          maxSelections: 2,
          isClosedManually: false,
          author: undefined,
          dataValues: {
            totalVoters: undefined,
            totalVotes: null,
          },
        },
      ],
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListPolls(req, res);

    expect(status).toHaveBeenCalledWith(200);
    const payload = json.mock.calls[0]?.[0] as unknown[];
    expect(payload[0]).toMatchObject({
      pollID: 2,
      createdBy: { userID: 99, nickname: "Utilisateur inconnu" },
      totalVoters: 0,
      totalVotes: 0,
    });
  });

  it("retourne 500 avec message si findAll échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerListPolls, makeReq, makeTypedRes } = await load({
      findAllReject: new Error("db error"),
    });

    const req = makeReq();
    const { res, status, json } = makeTypedRes();

    await controllerListPolls(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      message: "Impossible de récupérer les sondages.",
    });

    errSpy.mockRestore();
  });
});
