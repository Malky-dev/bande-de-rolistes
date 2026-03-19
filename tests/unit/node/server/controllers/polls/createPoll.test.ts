import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/polls/createPoll.ts"),
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
  userID?: number | null;
  transactionReject?: unknown;
  createResult?: { pollID: number };
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const transaction = {};
  const Poll = {
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
    create: vi.fn(),
  };

  const PollOption = { bulkCreate: vi.fn() };

  Poll.create.mockResolvedValue(opts?.createResult ?? { pollID: 42 });

  PollOption.bulkCreate.mockResolvedValue([]);

  const canManagePoll = vi.fn().mockReturnValue(opts?.canManagePoll ?? true);
  const getUserID = vi
    .fn()
    .mockReturnValue(opts !== undefined && "userID" in opts ? opts.userID : 7);
  const forbid = vi.fn((res: unknown) => res);
  const badRequest = vi.fn((res: unknown) => res);
  const unauthorized = vi.fn((res: unknown) => res);
  const normalizeString = vi.fn((v: string) => (v && String(v).trim()) || "");
  const normalizeOptionalString = vi.fn(
    (v: string | null | undefined) => (v != null && String(v).trim()) || null,
  );
  const normalizeOptionLabels = vi.fn((v: string[] | undefined) =>
    Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [],
  );

  vi.doMock(modelsUrl, () => ({
    Poll,
    PollOption,
  }));
  vi.doMock(helpersUrl, () => ({
    badRequest,
    canManagePoll,
    forbid,
    getUserID,
    normalizeOptionLabels,
    normalizeOptionalString,
    normalizeString,
    unauthorized,
  }));

  const mod = await import(controllerUrl);
  const controllerCreatePoll = mod.default;

  type Handler = typeof controllerCreatePoll;
  type ReqT = Parameters<Handler>[0];
  type ResT = Parameters<Handler>[1];

  const makeReq = (body?: Record<string, unknown>, user?: unknown): ReqT =>
    ({
      body: body ?? {},
      user: user ?? { userID: 7, role: { roleID: 1 } },
    }) as unknown as ReqT;

  const makeTypedRes = () => makeRes<ResT>();

  return {
    controllerCreatePoll,
    makeReq,
    makeTypedRes,
    mocks: {
      Poll,
      PollOption,
      canManagePoll,
      getUserID,
      forbid,
      badRequest,
      unauthorized,
      normalizeString,
      normalizeOptionalString,
      normalizeOptionLabels,
    },
  };
}

const validBody = {
  title: "Test poll",
  description: "Desc",
  endAt: new Date(Date.now() + 86400000).toISOString(),
  maxSelections: 1,
  options: ["A", "B"],
};

describe("controller createPoll", () => {
  it("retourne 403 si l'utilisateur n'a pas le droit de gérer les sondages", async () => {
    const { controllerCreatePoll, makeReq, makeTypedRes, mocks } = await load({
      canManagePoll: false,
    });

    const req = makeReq(validBody);
    const { res } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(mocks.forbid).toHaveBeenCalled();
    expect(mocks.Poll.create).not.toHaveBeenCalled();
  });

  it("retourne 401 si l'utilisateur n'est pas authentifié", async () => {
    const { controllerCreatePoll, makeReq, makeTypedRes, mocks } = await load({
      userID: null,
    });

    const req = makeReq(validBody);
    const { res } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(mocks.unauthorized).toHaveBeenCalledWith(
      expect.anything(),
      "Authentification requise.",
    );
  });

  it("retourne 400 si le titre est vide après normalisation", async () => {
    const { controllerCreatePoll, makeReq, makeTypedRes, mocks } = await load();
    mocks.normalizeString.mockReturnValue("");

    const req = makeReq({ ...validBody, title: "  " });
    const { res } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Le titre du sondage est obligatoire.",
    );
  });

  it("retourne 400 si la date de fin est invalide", async () => {
    const { controllerCreatePoll, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq({ ...validBody, endAt: "not-a-date" });
    const { res } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "La date de fin est invalide.",
    );
  });

  it("retourne 400 si la date de fin est dans le passé", async () => {
    const { controllerCreatePoll, makeReq, makeTypedRes, mocks } = await load();

    const req = makeReq({
      ...validBody,
      endAt: new Date(Date.now() - 1000).toISOString(),
    });
    const { res } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "La date de fin doit être dans le futur.",
    );
  });

  it("retourne 400 si moins de deux options", async () => {
    const { controllerCreatePoll, makeReq, makeTypedRes, mocks } = await load();
    mocks.normalizeOptionLabels.mockReturnValue(["A"]);

    const req = makeReq(validBody);
    const { res } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(mocks.badRequest).toHaveBeenCalledWith(
      expect.anything(),
      "Un sondage doit contenir au moins deux options.",
    );
  });

  it("retourne 201 avec pollID et message si création OK", async () => {
    const { controllerCreatePoll, makeReq, makeTypedRes, mocks } = await load({
      createResult: { pollID: 99 },
    });
    mocks.normalizeString.mockReturnValue("Test poll");
    mocks.normalizeOptionalString.mockReturnValue("Desc");
    mocks.normalizeOptionLabels.mockReturnValue(["A", "B"]);

    const req = makeReq(validBody);
    const { res, status, json } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(mocks.Poll.sequelize.transaction).toHaveBeenCalled();
    expect(mocks.Poll.create).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Test poll",
        description: "Desc",
        createdBy: 7,
        maxSelections: 1,
      }),
      { transaction: expect.anything() },
    );
    expect(mocks.PollOption.bulkCreate).toHaveBeenCalledWith(
      [
        { pollID: 99, label: "A", displayOrder: 0 },
        { pollID: 99, label: "B", displayOrder: 1 },
      ],
      { transaction: expect.anything() },
    );
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalledWith({
      pollID: 99,
      message: "Sondage créé avec succès.",
    });
  });

  it("retourne 500 avec message si erreur lors de la création", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { controllerCreatePoll, makeReq, makeTypedRes } = await load({
      transactionReject: new Error("boom"),
    });

    const req = makeReq(validBody);
    const { res, status, json } = makeTypedRes();

    await controllerCreatePoll(req, res);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de créer le sondage.",
    });

    errSpy.mockRestore();
  });
});
