import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/deleteOption.ts"),
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
  parseOptionID?: number | null;
  findOneResult?: unknown;
  optionCount?: number;
  destroyReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const optionInstance = {
    destroy: vi.fn().mockResolvedValue(undefined),
  };

  const PollOption = {
    findOne: vi.fn(),
    count: vi.fn(),
  };

  PollOption.findOne.mockResolvedValue(
    opts !== undefined && "findOneResult" in opts
      ? opts.findOneResult
      : optionInstance,
  );
  PollOption.count.mockResolvedValue(opts?.optionCount ?? 3);

  if (opts?.destroyReject !== undefined) {
    const r = opts.destroyReject;
    if (r instanceof Error) optionInstance.destroy.mockRejectedValue(r);
    else optionInstance.destroy.mockImplementation(() => Promise.reject(r));
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
    .mockReturnValueOnce(
      opts !== undefined && "parsePollID" in opts ? opts.parsePollID : 1,
    )
    .mockReturnValueOnce(
      opts !== undefined && "parseOptionID" in opts ? opts.parseOptionID : 1,
    );

  vi.doMock(modelsUrl, () => ({ PollOption }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canManagePoll,
    forbid,
    notFound,
    parseIntParam,
  }));

  const mod = await import(controllerUrl);
  const controllerDeleteOption = mod.default;

  type Handler = typeof controllerDeleteOption;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (pollID: string, optionID: string, user?: unknown): ReqT =>
    ({
      params: { pollID, optionID },
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerDeleteOption,
    makeReq,
    makeTypedRes,
    mocks: {
      PollOption,
      optionInstance,
      canManagePoll,
      forbid,
      badRequest,
      notFound,
    },
  };
}

describe("controller deleteOption", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de gérer les sondages", async () => {
    const { controllerDeleteOption, makeReq, makeTypedRes, mocks } = await load(
      { canManagePoll: false },
    );

    const req = makeReq("1", "2");
    const { res } = makeTypedRes();

    await controllerDeleteOption(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
  });

  it("retourne 400 si pollID est invalide", async () => {
    const { controllerDeleteOption, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc", "2");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteOption(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 400 si optionID est invalide", async () => {
    const { controllerDeleteOption, makeReq, makeTypedRes } = await load({
      parseOptionID: null,
    });

    const req = makeReq("1", "x");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteOption(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant d'option invalide.",
    });
  });

  it("retourne 404 si l'option est introuvable", async () => {
    const { controllerDeleteOption, makeReq, makeTypedRes } = await load({
      findOneResult: null,
    });

    const req = makeReq("1", "2");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteOption(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Option introuvable.",
    });
  });

  it("retourne 400 si le sondage n'aurait plus que deux options", async () => {
    const { controllerDeleteOption, makeReq, makeTypedRes, mocks } = await load(
      { optionCount: 2 },
    );

    const req = makeReq("1", "2");
    const { res } = makeTypedRes();

    await controllerDeleteOption(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Un sondage doit conserver au moins deux options.",
    );
  });

  it("retourne 200 avec message si suppression OK", async () => {
    const { controllerDeleteOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", "2");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteOption(req, res);

    expect(mocks.optionInstance.destroy).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Option supprimée avec succès.",
    });
  });

  it("retourne 500 avec message si destroy échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerDeleteOption, makeReq, makeTypedRes } = await load({
      destroyReject: new Error("boom"),
    });

    const req = makeReq("1", "2");
    const { res, status, json } = makeTypedRes();

    await controllerDeleteOption(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de supprimer l'option.",
    });

    errSpy.mockRestore();
  });
});
