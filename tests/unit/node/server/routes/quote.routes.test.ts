import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeReq, makeRes } from "@/../tests/helpers/express";
import { createRouterMock } from "./_routerMock";

const router = createRouterMock();

vi.mock("express", async () => {
  const actual = await vi.importActual<any>("express");
  return { ...actual, Router: () => router };
});

const Quote = {
  count: vi.fn(),
  findOne: vi.fn(),
};

vi.mock("@/server/models", () => ({ Quote }));

function ensureRes(res: any) {
  if (!res.status) res.status = vi.fn().mockReturnThis();
  if (!res.json) res.json = vi.fn().mockReturnThis();
  if (!res.send) res.send = vi.fn().mockReturnThis();
  return res;
}

async function load() {
  vi.resetModules();
  router.get.mockClear();

  await import("@/server/routes/quote");

  const getCall = router.get.mock.calls.find((c) => c[0] === "/quote");
  if (!getCall) throw new Error("Missing route GET /quote");

  return {
    getQuote: getCall[getCall.length - 1] as Function,
  };
}

describe("routes quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /quote retourne une citation publique", async () => {
    const { getQuote } = await load();

    Quote.count.mockResolvedValue(1);
    Quote.findOne.mockResolvedValue({
      content: "Wake up, Neo.",
      author: "Morpheus",
    });

    const req = makeReq({});
    const res = ensureRes(makeRes());

    await getQuote(req as any, res as any);

    expect(Quote.count).toHaveBeenCalledTimes(1);
    expect(Quote.findOne).toHaveBeenCalledTimes(1);
    expect(Quote.findOne).toHaveBeenCalledWith({
      order: [["quoteID", "ASC"]],
      offset: expect.any(Number),
      limit: 1,
      attributes: ["content", "author"],
    });

    expect(res.json).toHaveBeenCalledWith({
      content: "Wake up, Neo.",
      author: "Morpheus",
    });
  });

  it("GET /quote retourne 404 si aucune citation n’existe", async () => {
    const { getQuote } = await load();

    Quote.count.mockResolvedValue(0);

    const req = makeReq({});
    const res = ensureRes(makeRes());

    await getQuote(req as any, res as any);

    expect(Quote.findOne).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Aucune citation disponible",
    });
  });

  it("GET /quote retourne 404 si count est supérieur à 0 mais que findOne renvoie null", async () => {
    const { getQuote } = await load();

    Quote.count.mockResolvedValue(1);
    Quote.findOne.mockResolvedValue(null);

    const req = makeReq({});
    const res = ensureRes(makeRes());

    await getQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Aucune citation disponible",
    });
  });

  it("GET /quote retourne 500 en cas d’erreur", async () => {
    const { getQuote } = await load();

    Quote.count.mockRejectedValue(new Error("boom"));

    const req = makeReq({});
    const res = ensureRes(makeRes());

    await getQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur lors de la récupération de la citation",
    });
  });
});
