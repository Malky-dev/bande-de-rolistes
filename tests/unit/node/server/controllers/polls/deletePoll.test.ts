import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/deletePoll.ts"),
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
  destroyReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const pollInstance = {
    destroy: vi.fn().mockResolvedValue(undefined),
  };

  const Poll = { findByPk: vi.fn() };

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

  if (opts?.destroyReject !== undefined) {
    const r = opts.destroyReject;
    if (r instanceof Error) pollInstance.destroy.mockRejectedValue(r);
    else pollInstance.destroy.mockImplementation(() => Promise.reject(r));
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

  vi.doMock(modelsUrl, () => ({ Poll }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canManagePoll,
    forbid,
    notFound,
    parseIntParam,
  }));

  const mod = await import(controllerUrl);
  const controllerDeletePoll = mod.default;

  type Handler = typeof controllerDeletePoll;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (pollID: string, user?: unknown): ReqT =>
    ({
      params: { pollID },
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerDeletePoll,
    makeReq,
    makeTypedRes,
    mocks: { Poll, pollInstance, canManagePoll, forbid, badRequest, notFound },
  };
}

describe("controller deletePoll", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de gérer les sondages", async () => {
    const { controllerDeletePoll, makeReq, makeTypedRes, mocks } = await load({
      canManagePoll: false,
    });

    const req = makeReq("1");
    const { res } = makeTypedRes();

    await controllerDeletePoll(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
  });

  it("retourne 400 si pollID est invalide", async () => {
    const { controllerDeletePoll, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc");
    const { res, status, json } = makeTypedRes();

    await controllerDeletePoll(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 404 si le sondage est introuvable", async () => {
    const { controllerDeletePoll, makeReq, makeTypedRes } = await load({
      findByPkResult: null,
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerDeletePoll(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Sondage non trouvé.",
    });
  });

  it("retourne 200 avec message si suppression OK", async () => {
    const { controllerDeletePoll, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerDeletePoll(req, res);

    expect(mocks.pollInstance.destroy).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Sondage supprimé avec succès.",
    });
  });

  it("retourne 500 avec message si destroy échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerDeletePoll, makeReq, makeTypedRes } = await load({
      destroyReject: new Error("boom"),
    });

    const req = makeReq("1");
    const { res, status, json } = makeTypedRes();

    await controllerDeletePoll(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      message: "Impossible de supprimer le sondage.",
    });

    errSpy.mockRestore();
  });
});
