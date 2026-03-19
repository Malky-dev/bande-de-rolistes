import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/createOption.ts"),
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
  findOneResult?: unknown;
  createResult?: { optionID: number };
  createReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const pollInstance = {};
  const Poll = { findByPk: vi.fn() };
  const PollOption = {
    findOne: vi.fn(),
    create: vi.fn(),
  };

  Poll.findByPk.mockResolvedValue(
    opts !== undefined && "findByPkResult" in opts
      ? opts.findByPkResult
      : pollInstance,
  );
  PollOption.findOne.mockResolvedValue(
    opts !== undefined && "findOneResult" in opts
      ? opts.findOneResult
      : { displayOrder: 2 },
  );

  if (opts?.createReject !== undefined) {
    const r = opts.createReject;
    if (r instanceof Error) PollOption.create.mockRejectedValue(r);
    else PollOption.create.mockImplementation(() => Promise.reject(r));
  } else {
    PollOption.create.mockResolvedValue(opts?.createResult ?? { optionID: 10 });
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

  vi.doMock(modelsUrl, () => ({ Poll, PollOption }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canManagePoll,
    forbid,
    notFound,
    normalizeString: vi.fn((v: string) => (v && String(v).trim()) || ""),
    parseIntParam,
  }));

  const mod = await import(controllerUrl);
  const controllerCreateOption = mod.default;

  type Handler = typeof controllerCreateOption;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (
    pollID: string,
    body?: Record<string, unknown>,
    user?: unknown,
  ): ReqT =>
    ({
      params: { pollID },
      body: body ?? { label: "New option" },
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerCreateOption,
    makeReq,
    makeTypedRes,
    mocks: { Poll, PollOption, canManagePoll, forbid, badRequest, notFound },
  };
}

describe("controller createOption", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de gérer les sondages", async () => {
    const { controllerCreateOption, makeReq, makeTypedRes, mocks } = await load(
      { canManagePoll: false },
    );

    const req = makeReq("1", { label: "X" });
    const { res } = makeTypedRes();

    await controllerCreateOption(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
  });

  it("retourne 400 si pollID est invalide", async () => {
    const { controllerCreateOption, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc", { label: "X" });
    const { res, status, json } = makeTypedRes();

    await controllerCreateOption(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 400 si le libellé est vide après normalisation", async () => {
    const { controllerCreateOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", { label: "   " });
    const { res } = makeTypedRes();

    await controllerCreateOption(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Le libellé de l'option est obligatoire.",
    );
  });

  it("retourne 404 si le sondage est introuvable", async () => {
    const { controllerCreateOption, makeReq, makeTypedRes } = await load({
      findByPkResult: null,
    });

    const req = makeReq("1", { label: "X" });
    const { res, status, json } = makeTypedRes();

    await controllerCreateOption(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Sondage non trouvé.",
    });
  });

  it("retourne 201 avec optionID et message si création OK", async () => {
    const { controllerCreateOption, makeReq, makeTypedRes, mocks } = await load(
      { createResult: { optionID: 99 } },
    );

    const req = makeReq("1", { label: "New option" });
    const { res, status, json } = makeTypedRes();

    await controllerCreateOption(req, res);

    expect(mocks.PollOption.create).toHaveBeenCalledWith(
      expect.objectContaining({
        pollID: 1,
        label: "New option",
        displayOrder: 3,
      }),
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      optionID: 99,
      message: "Option ajoutée avec succès.",
    });
  });

  it("retourne 201 avec displayOrder 0 quand le sondage n'a pas encore d'options", async () => {
    const { controllerCreateOption, makeReq, makeTypedRes, mocks } = await load(
      { findOneResult: null, createResult: { optionID: 10 } },
    );

    const req = makeReq("1", { label: "First option" });
    const { res, status, json } = makeTypedRes();

    await controllerCreateOption(req, res);

    expect(mocks.PollOption.create).toHaveBeenCalledWith({
      pollID: 1,
      label: "First option",
      displayOrder: 0,
    });
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      optionID: 10,
      message: "Option ajoutée avec succès.",
    });
  });

  it("retourne 500 avec message si create échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerCreateOption, makeReq, makeTypedRes } = await load({
      createReject: new Error("boom"),
    });

    const req = makeReq("1", { label: "X" });
    const { res, status, json } = makeTypedRes();

    await controllerCreateOption(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      message: "Impossible d'ajouter l'option.",
    });

    errSpy.mockRestore();
  });
});
