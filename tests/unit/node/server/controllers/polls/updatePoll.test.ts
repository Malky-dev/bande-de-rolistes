import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/updatePoll.ts"),
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
  canManagePoll?: boolean;
  parsePollID?: number | null;
  findByPkResult?: unknown;
  findByPkReject?: unknown;
  optionCount?: number;
  votesFindAll?: Array<{ userID: number }>;
  updateReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const pollInstance = {
    update: vi.fn().mockResolvedValue(undefined),
  };

  const Poll = { findByPk: vi.fn() };
  const PollOption = { count: vi.fn() };
  const PollVote = { findAll: vi.fn() };

  if (opts?.findByPkReject !== undefined) {
    const r = opts.findByPkReject;
    if (r instanceof Error) Poll.findByPk.mockRejectedValue(r);
    else Poll.findByPk.mockImplementation(() => Promise.reject(r));
  } else {
    Poll.findByPk.mockResolvedValue(
      opts !== undefined && "findByPkResult" in opts
        ? opts.findByPkResult
        : pollInstance,
    );
  }

  PollOption.count.mockResolvedValue(opts?.optionCount ?? 3);
  PollVote.findAll.mockResolvedValue(
    opts?.votesFindAll ?? [{ userID: 1 }, { userID: 1 }],
  );

  if (opts?.updateReject !== undefined) {
    const r = opts.updateReject;
    if (r instanceof Error) pollInstance.update.mockRejectedValue(r);
    else pollInstance.update.mockImplementation(() => Promise.reject(r));
  }

  const canManagePoll = vi.fn().mockReturnValue(opts?.canManagePoll ?? true);
  const forbid = vi.fn((res: unknown) => res);
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
  const normalizeString = vi.fn((v: string) => (v && String(v).trim()) || "");
  const normalizeOptionalString = vi.fn(
    (v: string | null | undefined) => (v != null && String(v).trim()) || null,
  );

  vi.doMock(modelsUrl, () => ({ Poll, PollOption, PollVote }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canManagePoll,
    forbid,
    notFound,
    normalizeOptionalString,
    normalizeString,
    parseIntParam,
  }));

  const mod = await import(controllerUrl);
  const controllerUpdatePoll = mod.default;

  type Handler = typeof controllerUpdatePoll;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (
    pollID: string,
    body?: Record<string, unknown>,
    user?: unknown,
  ): ReqT =>
    ({
      params: { pollID },
      body: body ?? {},
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerUpdatePoll,
    makeReq,
    makeTypedRes,
    mocks: {
      Poll,
      PollOption,
      PollVote,
      pollInstance,
      canManagePoll,
      forbid,
      badRequest,
      notFound,
      parseIntParam,
    },
  };
}

describe("controller updatePoll", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de gérer les sondages", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes, mocks } = await load({
      canManagePoll: false,
    });

    const req = makeReq("1", { title: "New title" });
    const { res } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
  });

  it("retourne 400 si pollID est invalide", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc", { title: "New" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 400 si le titre fourni est vide après normalisation", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq("1", { title: "   " });
    const { res } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Le titre du sondage ne peut pas être vide.",
    );
  });

  it("retourne 404 si le sondage est introuvable", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load({
      findByPkResult: null,
    });

    const req = makeReq("1", { title: "New" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Sondage non trouvé.",
    });
  });

  it("retourne 400 si aucune modification valide n'est fournie", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq("1", {});
    const { res } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Aucune modification valide n'a été fournie.",
    );
  });

  it("retourne 200 avec message si mise à jour OK (title)", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq("1", { title: "New title" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(mocks.pollInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ title: "New title" }),
    );
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Sondage mis à jour avec succès.",
    });
  });

  it("retourne 200 avec message si mise à jour OK (description)", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq("1", { description: "New description" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(mocks.pollInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ description: "New description" }),
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  it("retourne 400 si endAt est invalide", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load();

    const req = makeReq("1", { endAt: "not-a-date" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "La date de fin est invalide.",
    });
  });

  it("retourne 400 si endAt est dans le passé", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load();

    const req = makeReq("1", {
      endAt: new Date(Date.now() - 1000).toISOString(),
    });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "La date de fin doit être dans le futur.",
    });
  });

  it("retourne 200 avec message si mise à jour OK (endAt)", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes, mocks } = await load();

    const future = new Date(Date.now() + 86400000).toISOString();
    const req = makeReq("1", { endAt: future });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(mocks.pollInstance.update).toHaveBeenCalledWith(
      expect.objectContaining({ endAt: expect.any(Date) }),
    );
    expect(status).toHaveBeenCalledWith(200);
  });

  it("retourne 400 si maxSelections n'est pas un entier >= 1", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load();

    const req = makeReq("1", { maxSelections: 0 });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message:
        "Pour le moment, un sondage ne peut autoriser qu'une seule sélection.",
    });
  });

  it("retourne 400 si maxSelections dépasse le nombre d'options", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load({
      optionCount: 2,
    });

    const req = makeReq("1", { maxSelections: 5 });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message:
        "Pour le moment, un sondage ne peut autoriser qu'une seule sélection.",
    });
  });

  it("retourne 400 si maxSelections invaliderait des votes existants", async () => {
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load({
      optionCount: 5,
      votesFindAll: [{ userID: 1 }, { userID: 1 }, { userID: 1 }],
    });

    const req = makeReq("1", { maxSelections: 2 });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message:
        "Pour le moment, un sondage ne peut autoriser qu'une seule sélection.",
    });
  });

  it("retourne 500 avec message si erreur lors de la mise à jour", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdatePoll, makeReq, makeTypedRes } = await load({
      updateReject: new Error("boom"),
    });

    const req = makeReq("1", { title: "New" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdatePoll(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de mettre à jour le sondage.",
    });

    errSpy.mockRestore();
  });
});
