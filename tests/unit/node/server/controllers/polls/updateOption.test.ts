import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/updateOption.ts"),
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
  updateReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const optionInstance = {
    update: vi.fn().mockResolvedValue(undefined),
  };

  const PollOption = {
    findOne: vi.fn(),
  };

  PollOption.findOne.mockResolvedValue(
    opts !== undefined && "findOneResult" in opts
      ? opts.findOneResult
      : optionInstance,
  );

  if (opts?.updateReject !== undefined) {
    const r = opts.updateReject;
    if (r instanceof Error) optionInstance.update.mockRejectedValue(r);
    else optionInstance.update.mockImplementation(() => Promise.reject(r));
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
    normalizeString: vi.fn((v: string) => (v && String(v).trim()) || ""),
    parseIntParam,
  }));

  const mod = await import(controllerUrl);
  const controllerUpdateOption = mod.default;

  type Handler = typeof controllerUpdateOption;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (
    pollID: string,
    optionID: string,
    body?: Record<string, unknown>,
    user?: unknown,
  ): ReqT =>
    ({
      params: { pollID, optionID },
      body: body ?? {},
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerUpdateOption,
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

describe("controller updateOption", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de gérer les sondages", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes, mocks } = await load(
      {
        canManagePoll: false,
      },
    );

    const req = makeReq("1", "2", { label: "X" });
    const { res } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
  });

  it("retourne 400 si pollID est invalide", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes } = await load({
      parsePollID: null,
    });

    const req = makeReq("abc", "2", { label: "X" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant de sondage invalide.",
    });
  });

  it("retourne 400 si optionID est invalide", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes } = await load({
      parseOptionID: null,
    });

    const req = makeReq("1", "x", { label: "X" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Identifiant d'option invalide.",
    });
  });

  it("retourne 400 si le libellé fourni est vide", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", "2", { label: "   " });
    const { res } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Le libellé de l'option ne peut pas être vide.",
    );
  });

  it("retourne 400 si displayOrder n'est pas un entier >= 0", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", "2", { displayOrder: -1 });
    const { res } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "L'ordre d'affichage doit être un entier supérieur ou égal à 0.",
    );
  });

  it("retourne 400 si displayOrder est un décimal", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", "2", { displayOrder: 1.5 });
    const { res } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "L'ordre d'affichage doit être un entier supérieur ou égal à 0.",
    );
  });

  it("retourne 400 si aucune modification valide n'est fournie", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", "2", {});
    const { res } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Aucune modification valide n'a été fournie.",
    );
  });

  it("retourne 404 si l'option est introuvable", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes } = await load({
      findOneResult: null,
    });

    const req = makeReq("1", "2", { label: "X" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Option introuvable.",
    });
  });

  it("retourne 200 avec message si mise à jour OK (label)", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", "2", { label: "New label" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(mocks.optionInstance.update).toHaveBeenCalledWith({
      label: "New label",
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Option mise à jour avec succès.",
    });
  });

  it("retourne 200 avec message si mise à jour OK (displayOrder)", async () => {
    const { controllerUpdateOption, makeReq, makeTypedRes, mocks } =
      await load();

    const req = makeReq("1", "2", { displayOrder: 5 });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(mocks.optionInstance.update).toHaveBeenCalledWith({
      displayOrder: 5,
    });
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      message: "Option mise à jour avec succès.",
    });
  });

  it("retourne 500 avec message si update échoue", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerUpdateOption, makeReq, makeTypedRes } = await load({
      updateReject: new Error("boom"),
    });

    const req = makeReq("1", "2", { label: "X" });
    const { res, status, json } = makeTypedRes();

    await controllerUpdateOption(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      message: "Impossible de mettre à jour l'option.",
    });

    errSpy.mockRestore();
  });
});
