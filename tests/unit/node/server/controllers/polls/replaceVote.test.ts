import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/replaceVote.ts"),
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
  uniqueNumbersReturn?: number[];
  findByPkResult?: unknown;
  isPollClosed?: boolean;
  maxSelections?: number;
  optionsFindAll?: Array<{ optionID: number }>;
  transactionReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const transaction = {};
  const Poll = { findByPk: vi.fn() };
  const PollOption = { findAll: vi.fn() };
  const PollVote = {
    sequelize: {
      transaction: vi.fn((cb: (t: unknown) => Promise<unknown>) => {
        if (opts?.transactionReject !== undefined) {
          const r = opts.transactionReject;
          if (r instanceof Error) return Promise.reject(r);
          return Promise.reject(new Error(String(r)));
        }
        return cb(transaction);
      }),
    },
    destroy: vi.fn().mockResolvedValue(undefined),
    bulkCreate: vi.fn().mockResolvedValue([]),
  };

  const pollInstance = {
    pollID: 1,
    maxSelections: opts?.maxSelections ?? 1,
  };

  Poll.findByPk.mockResolvedValue(
    opts !== undefined && "findByPkResult" in opts
      ? opts.findByPkResult
      : pollInstance,
  );
  PollOption.findAll.mockResolvedValue(
    opts?.optionsFindAll ?? [{ optionID: 1 }, { optionID: 2 }],
  );

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
  const uniqueNumbers = vi
    .fn()
    .mockReturnValue(opts?.uniqueNumbersReturn ?? [1]);
  const isPollClosed = vi.fn().mockReturnValue(opts?.isPollClosed ?? false);

  vi.doMock(modelsUrl, () => ({ Poll, PollOption, PollVote }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canVotePoll,
    forbid,
    getUserID,
    isPollClosed,
    notFound,
    parseIntParam,
    unauthorized,
    uniqueNumbers,
  }));

  const mod = await import(controllerUrl);
  const controllerReplaceVote = mod.default;

  type Handler = typeof controllerReplaceVote;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (
    pollID: string,
    body?: Record<string, unknown>,
    user?: unknown,
  ): ReqT =>
    ({
      params: { pollID },
      body: body ?? { optionIDs: [1] },
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerReplaceVote,
    makeReq,
    makeTypedRes,
    mocks: {
      Poll,
      PollOption,
      PollVote,
      canVotePoll,
      forbid,
      getUserID,
      unauthorized,
      badRequest,
      notFound,
      uniqueNumbers,
      isPollClosed,
    },
  };
}

describe("controller replaceVote", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de voter", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes, mocks } = await load({
      canVotePoll: false,
    });

    const req = makeReq("1", { optionIDs: [1] });
    const { res } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes, mocks } = await load({
      userID: null,
    });

    const req = makeReq("1", { optionIDs: [1] });
    const { res } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(mocks.unauthorized).toHaveBeenCalledWith(
      expect.anything(),
      "Authentification requise.",
    );
  });

  it("retourne 400 si pollID est invalide", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc", { optionIDs: [1] });
    const { res, status, json } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 400 si optionIDs est vide après normalisation", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes, mocks } = await load({
      uniqueNumbersReturn: [],
    });

    const req = makeReq("1", { optionIDs: [] });
    const { res } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Vous devez sélectionner au moins une option.",
    );
  });

  it("retourne 404 si le sondage est introuvable", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes } = await load({
      findByPkResult: null,
    });

    const req = makeReq("1", { optionIDs: [1] });
    const { res, status, json } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Sondage non trouvé.",
    });
  });

  it("retourne 400 si le sondage est fermé", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes, mocks } = await load({
      isPollClosed: true,
    });

    const req = makeReq("1", { optionIDs: [1] });
    const { res } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Ce sondage est fermé.",
    );
  });

  it("retourne 400 si trop d'options sélectionnées par rapport à maxSelections", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes, mocks } = await load({
      uniqueNumbersReturn: [1, 2, 3],
      maxSelections: 2,
    });

    const req = makeReq("1", { optionIDs: [1, 2, 3] });
    const { res } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Vous ne pouvez pas sélectionner plus de 2 option(s).",
    );
  });

  it("retourne 400 si une option sélectionnée n'appartient pas au sondage", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes, mocks } = await load({
      uniqueNumbersReturn: [1, 99],
      optionsFindAll: [{ optionID: 1 }, { optionID: 2 }],
      maxSelections: 2,
    });

    const req = makeReq("1", { optionIDs: [1, 99] });
    const { res } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Au moins une option sélectionnée n'appartient pas à ce sondage.",
    );
  });

  it("retourne 200 avec message si vote enregistré", async () => {
    const { controllerReplaceVote, makeReq, makeTypedRes, mocks } = await load({
      uniqueNumbersReturn: [1, 2],
      maxSelections: 2,
    });

    const req = makeReq("1", { optionIDs: [1, 2] });
    const { res, status, json } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(mocks.PollVote.sequelize.transaction).toHaveBeenCalled();
    expect(mocks.PollVote.destroy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { pollID: 1, userID: 7 },
      }),
    );
    expect(mocks.PollVote.bulkCreate).toHaveBeenCalledWith(
      [
        { pollID: 1, optionID: 1, userID: 7 },
        { pollID: 1, optionID: 2, userID: 7 },
      ],
      { transaction: expect.anything() },
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Vote enregistré avec succès.",
    });
  });

  it("retourne 500 avec message si transaction échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerReplaceVote, makeReq, makeTypedRes } = await load({
      transactionReject: new Error("boom"),
    });

    const req = makeReq("1", { optionIDs: [1] });
    const { res, status, json } = makeTypedRes();

    await controllerReplaceVote(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible d'enregistrer le vote.",
    });

    errSpy.mockRestore();
  });
});
