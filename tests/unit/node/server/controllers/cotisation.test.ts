import { describe, it, expect, vi } from "vitest";
import type { NextFunction } from "express";
import path from "node:path";
import { pathToFileURL } from "node:url";

type Fn = ReturnType<typeof vi.fn>;

const makeRes = () => {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const resObj = { status, json } as Record<string, unknown>;
  const res = resObj as unknown;
  return { res, status, json };
};

const makeNext = (): NextFunction => vi.fn() as unknown as NextFunction;

const root = process.cwd();

const controllerUrl = pathToFileURL(
  path.join(root, "src/server/controllers/cotisation.ts"),
).href;

const cotisationModelUrl = pathToFileURL(
  path.join(root, "src/server/models/Cotisation.ts"),
).href;

const cotisationUtilsUrl = pathToFileURL(
  path.join(root, "src/server/utils/cotisation.ts"),
).href;

async function load(opts?: {
  createPaidCotisationResult?: unknown;
  createPaidCotisationReject?: unknown;
  getMembershipStatusResult?: unknown;
  getMembershipStatusReject?: unknown;
  findAllResult?: unknown;
  findAllReject?: unknown;
}) {
  vi.resetModules();
  vi.clearAllMocks();

  const Cotisation = {
    findAll: vi.fn(),
  };

  if (opts?.findAllReject !== undefined) {
    if (opts.findAllReject instanceof Error)
      Cotisation.findAll.mockRejectedValue(opts.findAllReject);
    else
      Cotisation.findAll.mockImplementation(() => {
        throw opts.findAllReject;
      });
  } else {
    Cotisation.findAll.mockResolvedValue(opts?.findAllResult ?? []);
  }

  const createPaidCotisation = vi.fn();
  if (opts?.createPaidCotisationReject !== undefined) {
    if (opts.createPaidCotisationReject instanceof Error)
      createPaidCotisation.mockRejectedValue(opts.createPaidCotisationReject);
    else
      createPaidCotisation.mockImplementation(() => {
        throw opts.createPaidCotisationReject;
      });
  } else {
    createPaidCotisation.mockResolvedValue(
      opts?.createPaidCotisationResult ?? {
        cotisationID: 1,
        userID: 7,
        amountCents: 1000,
        paidAt: null,
        periodStart: new Date("2026-01-01T00:00:00.000Z"),
        periodEnd: new Date("2026-12-31T23:59:59.999Z"),
        status: "paid",
      },
    );
  }

  const getMembershipStatus = vi.fn();
  if (opts?.getMembershipStatusReject !== undefined) {
    if (opts.getMembershipStatusReject instanceof Error)
      getMembershipStatus.mockRejectedValue(opts.getMembershipStatusReject);
    else
      getMembershipStatus.mockImplementation(() => {
        throw opts.getMembershipStatusReject;
      });
  } else {
    getMembershipStatus.mockResolvedValue(
      opts?.getMembershipStatusResult ?? { isMember: true },
    );
  }

  vi.doMock(cotisationModelUrl, () => ({
    __esModule: true,
    default: Cotisation,
  }));

  vi.doMock(cotisationUtilsUrl, () => ({
    createPaidCotisation,
    getMembershipStatus,
  }));

  const mod = await import(controllerUrl);

  const { createCotisation, getCotisationStatus, listCotisations } = mod;

  type CreateReq = Parameters<typeof createCotisation>[0];
  type CreateRes = Parameters<typeof createCotisation>[1];

  type StatusReq = Parameters<typeof getCotisationStatus>[0];
  type StatusRes = Parameters<typeof getCotisationStatus>[1];

  type ListReq = Parameters<typeof listCotisations>[0];
  type ListRes = Parameters<typeof listCotisations>[1];

  const makeReqCreate = (data?: {
    params?: unknown;
    body?: unknown;
  }): CreateReq =>
    ({ params: data?.params ?? {}, body: data?.body }) as unknown as CreateReq;

  const makeReqStatus = (data?: { params?: unknown }): StatusReq =>
    ({ params: data?.params ?? {} }) as unknown as StatusReq;

  const makeReqList = (data?: { params?: unknown }): ListReq =>
    ({ params: data?.params ?? {} }) as unknown as ListReq;

  const makeResCreate = () =>
    makeRes() as { res: CreateRes; status: Fn; json: Fn };
  const makeResStatus = () =>
    makeRes() as { res: StatusRes; status: Fn; json: Fn };
  const makeResList = () => makeRes() as { res: ListRes; status: Fn; json: Fn };

  return {
    createCotisation,
    getCotisationStatus,
    listCotisations,
    makeReqCreate,
    makeReqStatus,
    makeReqList,
    makeResCreate,
    makeResStatus,
    makeResList,
    mocks: { Cotisation, createPaidCotisation, getMembershipStatus },
  };
}

describe("cotisation controllers", () => {
  it("createCotisation: 400 si userID invalide", async () => {
    const { createCotisation, makeReqCreate, makeResCreate } = await load();

    const req = makeReqCreate({ params: { userID: "0" }, body: {} });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_USER_ID",
      message: "Invalid userID",
    });
  });

  it("createCotisation: 400 si amountCents invalide", async () => {
    const { createCotisation, makeReqCreate, makeResCreate } = await load();

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: -1 },
    });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_AMOUNT",
      message: "amountCents must be a non-negative integer",
    });
  });

  it("createCotisation: 400 si paidAt invalide", async () => {
    const { createCotisation, makeReqCreate, makeResCreate } = await load();

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 1000, paidAt: { bad: true } },
    });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_PAID_AT",
      message: "paidAt must be a valid date (ISO string, timestamp, or Date)",
    });
  });

  it("createCotisation: 400 si body n'est pas un record", async () => {
    const { createCotisation, makeReqCreate, makeResCreate } = await load();

    const req = makeReqCreate({
      params: { userID: "7" },
      body: null,
    });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_AMOUNT",
      message: "amountCents must be a non-negative integer",
    });
  });

  it("createCotisation: 400 si paidAt est un Date invalide", async () => {
    const { createCotisation, makeReqCreate, makeResCreate } = await load();

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 1000, paidAt: new Date("invalid") },
    });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_PAID_AT",
      message: "paidAt must be a valid date (ISO string, timestamp, or Date)",
    });
  });

  it("createCotisation: 400 si paidAt number est invalide", async () => {
    const { createCotisation, makeReqCreate, makeResCreate } = await load();

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 1000, paidAt: Number.NaN },
    });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_PAID_AT",
      message: "paidAt must be a valid date (ISO string, timestamp, or Date)",
    });
  });

  it("createCotisation: 400 si paidAt string est invalide", async () => {
    const { createCotisation, makeReqCreate, makeResCreate } = await load();

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 1000, paidAt: "not-a-date" },
    });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_PAID_AT",
      message: "paidAt must be a valid date (ISO string, timestamp, or Date)",
    });
  });

  it("createCotisation: 201 + payload si ok", async () => {
    const { createCotisation, makeReqCreate, makeResCreate, mocks } =
      await load({
        createPaidCotisationResult: {
          cotisationID: 9,
          userID: 7,
          amountCents: 2500,
          paidAt: null,
          periodStart: new Date("2026-01-01T00:00:00.000Z"),
          periodEnd: new Date("2026-12-31T23:59:59.999Z"),
          status: "paid",
        },
      });

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 2500, paidAt: "" },
    });
    const { res, status, json } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(mocks.createPaidCotisation).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(201);
    expect(json).toHaveBeenCalled();
  });

  it("createCotisation: accepte paidAt Date valide", async () => {
    const { createCotisation, makeReqCreate, makeResCreate, mocks } =
      await load({
        createPaidCotisationResult: {
          cotisationID: 11,
          userID: 7,
          amountCents: 2000,
          paidAt: new Date("2026-03-04T05:06:07.000Z"),
          periodStart: "2026-03-04",
          periodEnd: "2027-03-03",
          status: "paid",
        },
      });

    const paidAt = new Date("2026-03-04T05:06:07.000Z");
    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 2000, paidAt },
    });
    const { res, status } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(mocks.createPaidCotisation).toHaveBeenCalledWith({
      userID: 7,
      amountCents: 2000,
      paidAt,
    });
    expect(status).toHaveBeenCalledWith(201);
  });

  it("createCotisation: accepte paidAt number", async () => {
    const { createCotisation, makeReqCreate, makeResCreate, mocks } =
      await load({
        createPaidCotisationResult: {
          cotisationID: 9,
          userID: 7,
          amountCents: 2500,
          paidAt: new Date("2026-01-02T00:00:00.000Z"),
          periodStart: "2026-01-02",
          periodEnd: "2027-01-01",
          status: "paid",
        },
      });

    const paidAt = Date.parse("2026-01-02T00:00:00.000Z");
    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: "2500", paidAt },
    });
    const { res, status } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(mocks.createPaidCotisation).toHaveBeenCalledWith({
      userID: 7,
      amountCents: 2500,
      paidAt: new Date(paidAt),
    });
    expect(status).toHaveBeenCalledWith(201);
  });

  it("createCotisation: accepte paidAt string ISO", async () => {
    const { createCotisation, makeReqCreate, makeResCreate, mocks } =
      await load({
        createPaidCotisationResult: {
          cotisationID: 10,
          userID: 7,
          amountCents: 1500,
          paidAt: new Date("2026-02-03T04:05:06.000Z"),
          periodStart: "2026-02-03",
          periodEnd: "2027-02-02",
          status: "paid",
        },
      });

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 1500, paidAt: "2026-02-03T04:05:06.000Z" },
    });
    const { res, status } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(mocks.createPaidCotisation).toHaveBeenCalledWith({
      userID: 7,
      amountCents: 1500,
      paidAt: new Date("2026-02-03T04:05:06.000Z"),
    });
    expect(status).toHaveBeenCalledWith(201);
  });

  it("createCotisation: next(err) si erreur", async () => {
    const err = new Error("boom");
    const { createCotisation, makeReqCreate, makeResCreate } = await load({
      createPaidCotisationReject: err,
    });

    const req = makeReqCreate({
      params: { userID: "7" },
      body: { amountCents: 1000 },
    });
    const { res } = makeResCreate();
    const next = makeNext();

    await createCotisation(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("getCotisationStatus: 400 si userID invalide", async () => {
    const { getCotisationStatus, makeReqStatus, makeResStatus } = await load();

    const req = makeReqStatus({ params: { userID: "NaN" } });
    const { res, status, json } = makeResStatus();
    const next = makeNext();

    await getCotisationStatus(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_USER_ID",
      message: "Invalid userID",
    });
  });

  it("getCotisationStatus: 200 + status", async () => {
    const { getCotisationStatus, makeReqStatus, makeResStatus, mocks } =
      await load({
        getMembershipStatusResult: { isMember: false },
      });

    const req = makeReqStatus({ params: { userID: "7" } });
    const { res, status, json } = makeResStatus();
    const next = makeNext();

    await getCotisationStatus(req, res, next);

    expect(mocks.getMembershipStatus).toHaveBeenCalledWith(7);
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({ isMember: false });
  });

  it("getCotisationStatus: next(err) si erreur", async () => {
    const err = new Error("boom");
    const { getCotisationStatus, makeReqStatus, makeResStatus } = await load({
      getMembershipStatusReject: err,
    });

    const req = makeReqStatus({ params: { userID: "7" } });
    const { res } = makeResStatus();
    const next = makeNext();

    await getCotisationStatus(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });

  it("listCotisations: 200 + items", async () => {
    const { listCotisations, makeReqList, makeResList, mocks } = await load({
      findAllResult: [{ cotisationID: 1 }, { cotisationID: 2 }],
    });

    const req = makeReqList({ params: { userID: "7" } });
    const { res, status, json } = makeResList();
    const next = makeNext();

    await listCotisations(req, res, next);

    expect(mocks.Cotisation.findAll).toHaveBeenCalled();
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([
      { cotisationID: 1 },
      { cotisationID: 2 },
    ]);
  });

  it("listCotisations: 400 si userID invalide", async () => {
    const { listCotisations, makeReqList, makeResList, mocks } = await load();

    const req = makeReqList({ params: { userID: "NaN" } });
    const { res, status, json } = makeResList();
    const next = makeNext();

    await listCotisations(req, res, next);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: "BAD_USER_ID",
      message: "Invalid userID",
    });
    expect(mocks.Cotisation.findAll).not.toHaveBeenCalled();
  });

  it("listCotisations: next(err) si erreur", async () => {
    const err = new Error("boom");
    const { listCotisations, makeReqList, makeResList } = await load({
      findAllReject: err,
    });

    const req = makeReqList({ params: { userID: "7" } });
    const { res } = makeResList();
    const next = makeNext();

    await listCotisations(req, res, next);

    expect(next).toHaveBeenCalledWith(err);
  });
});
