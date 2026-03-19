import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/deleteVote.ts"),
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

async function load(opts?: {
  canVotePoll?: boolean;
  userID?: number | null;
  parsePollID?: number | null;
  findByPkResult?: unknown;
  isPollClosed?: boolean;
  destroyReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Poll = { findByPk: vi.fn() };
  const PollVote = { destroy: vi.fn().mockResolvedValue(undefined) };

  const pollInstance = { pollID: 1 };

  Poll.findByPk.mockResolvedValue(
    opts !== undefined && "findByPkResult" in opts
      ? opts.findByPkResult
      : pollInstance,
  );

  if (opts?.destroyReject !== undefined) {
    const r = opts.destroyReject;
    if (r instanceof Error) PollVote.destroy.mockRejectedValue(r);
    else PollVote.destroy.mockImplementation(() => Promise.reject(r));
  }

  const canVotePoll = vi.fn().mockReturnValue(opts?.canVotePoll ?? true);
  const forbid = vi.fn((res: unknown) => res);
  const getUserID = vi
    .fn()
    .mockReturnValue(opts !== undefined && "userID" in opts ? opts.userID : 7);
  const unauthorized = vi.fn((res: unknown) => res);
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
  const parseIntParam = vi
    .fn()
    .mockReturnValue(
      opts !== undefined && "parsePollID" in opts ? opts.parsePollID : 1,
    );
  const isPollClosed = vi.fn().mockReturnValue(opts?.isPollClosed ?? false);

  vi.doMock(modelsUrl, () => ({ Poll, PollVote }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canVotePoll,
    forbid,
    getUserID,
    isPollClosed,
    notFound,
    parseIntParam,
    unauthorized,
  }));

  const mod = await import(controllerUrl);
  const controllerDeleteVote = mod.default;

  type Handler = typeof controllerDeleteVote;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (pollID: string, user?: unknown): ReqT =>
    ({
      params: { pollID },
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerDeleteVote,
    makeReq,
    makeTypedRes,
    mocks: {
      Poll,
      PollVote,
      canVotePoll,
      forbid,
      getUserID,
      unauthorized,
      badRequest,
      notFound,
      isPollClosed,
    },
  };
}

describe("controller deleteVote", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de voter", async () => {
    const { controllerDeleteVote, makeReq, makeTypedRes, mocks } = await load({
      canVotePoll: false,
    });

    const req = makeReq("1");
    const { res } = makeTypedRes();

    await controllerDeleteVote(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    const { controllerDeleteVote, makeReq, makeTypedRes, mocks } = await load({
      userID: null,
    });

    const req = makeReq("1");
    const { res } = makeTypedRes();

    await controllerDeleteVote(req, res);

    expect(mocks.unauthorized).toHaveBeenCalledWith(
      expect.anything(),
      "Authentification requise.",
    );
  });

  it("retourne 400 si pollID est invalide", async () => {
    const { controllerDeleteVote, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteVote(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 404 si le sondage est introuvable", async () => {
    const { controllerDeleteVote, makeReq, makeTypedRes } = await load({
      findByPkResult: null,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteVote(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Sondage non trouvé.",
    });
  });

  it("retourne 400 si le sondage est fermé", async () => {
    const { controllerDeleteVote, makeReq, makeTypedRes, mocks } = await load({
      isPollClosed: true,
    });

    const req = makeReq("1");
    const { res } = makeTypedRes();

    await controllerDeleteVote(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Ce sondage est fermé.",
    );
  });

  it("retourne 200 avec message si vote supprimé", async () => {
    const { controllerDeleteVote, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteVote(req, res);

    expect(mocks.PollVote.destroy).toHaveBeenCalledWith({
      where: { pollID: 1, userID: 7 },
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Vote supprimé avec succès.",
    });
  });

  it("retourne 500 avec message si destroy échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerDeleteVote, makeReq, makeTypedRes } = await load({
      destroyReject: new Error("boom"),
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteVote(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de supprimer le vote.",
    });

    errSpy.mockRestore();
  });
});
