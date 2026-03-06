import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouterMock } from "./_routerMock";
import { makeReq, makeRes } from "@/../tests/helpers/express";

const router = createRouterMock();

vi.mock("express", async () => {
  const actual = await vi.importActual<any>("express");
  return { ...actual, Router: () => router };
});

vi.mock("sequelize", () => ({
  Op: { or: "or", like: "like" },
}));

const Quote = {
  findAndCountAll: vi.fn(),
  create: vi.fn(),
  findByPk: vi.fn(),
  destroy: vi.fn(),
};

vi.mock("@/server/models", () => ({ Quote }));

const requireStaffMw = vi.fn();
const requireStaff = vi.fn(() => requireStaffMw);

const verifyCsrfMw = vi.fn();
const verifyCsrf = vi.fn(() => verifyCsrfMw);

vi.mock("@/server/middleware", () => ({
  requireStaff,
  verifyCsrf,
}));

function ensureRes(res: any) {
  if (!res.status) res.status = vi.fn().mockReturnThis();
  if (!res.json) res.json = vi.fn().mockReturnThis();
  if (!res.send) res.send = vi.fn().mockReturnThis();
  return res;
}

async function load() {
  vi.resetModules();
  router.get.mockClear();
  router.post.mockClear();
  router.put.mockClear();
  router.delete.mockClear();
  await import("@/server/routes/quote");
  const calls = {
    get: router.get.mock.calls,
    post: router.post.mock.calls,
    put: router.put.mock.calls,
    delete: router.delete.mock.calls,
  };
  const findHandler = (method: keyof typeof calls, path: string) => {
    const call = calls[method].find((c) => c[0] === path);
    if (!call) throw new Error(`Missing route ${method.toUpperCase()} ${path}`);
    return call[call.length - 1] as Function;
  };
  return {
    getQuotes: findHandler("get", "/quotes"),
    postQuotes: findHandler("post", "/quotes"),
    putQuote: findHandler("put", "/quotes/:quoteID"),
    deleteQuote: findHandler("delete", "/quotes/:quoteID"),
  };
}

describe("routes/quote", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("GET /quotes: where undefined, pagination default, success", async () => {
    const { getQuotes } = await load();

    Quote.findAndCountAll.mockResolvedValue({
      rows: [{ quoteID: 1 }],
      count: 1,
    });

    const req = makeReq({ query: {} });
    const res = ensureRes(makeRes());

    await getQuotes(req as any, res as any);

    expect(Quote.findAndCountAll).toHaveBeenCalledTimes(1);
    const args = Quote.findAndCountAll.mock.calls[0][0];
    expect(args.where).toBeUndefined();
    expect(args.limit).toBe(10);
    expect(args.offset).toBe(0);

    expect(res.json).toHaveBeenCalledWith({
      items: [{ quoteID: 1 }],
      page: 1,
      limit: 10,
      totalItems: 1,
      totalPages: 1,
      q: "",
    });
  });

  it("GET /quotes: clamps page/limit + escape q + where defined", async () => {
    const { getQuotes } = await load();

    Quote.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

    const req = makeReq({
      query: { page: "-2", limit: "999", q: "  %_\\abc  " },
    });
    const res = ensureRes(makeRes());

    await getQuotes(req as any, res as any);

    const args = Quote.findAndCountAll.mock.calls[0][0];
    expect(args.limit).toBe(50);
    expect(args.offset).toBe(0);
    expect(args.where).toBeTruthy();

    const payload = (res.json as any).mock.calls[0][0];
    expect(payload.page).toBe(1);
    expect(payload.limit).toBe(50);
    expect(payload.q).toBe("%_\\abc");
  });

  it("GET /quotes: catch -> 500", async () => {
    const { getQuotes } = await load();

    Quote.findAndCountAll.mockRejectedValue(new Error("boom"));

    const req = makeReq({ query: {} });
    const res = ensureRes(makeRes());

    await getQuotes(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur lors du chargement des citations",
    });
  });

  it("POST /quotes: 400 si contenu invalide", async () => {
    const { postQuotes } = await load();

    const req = makeReq({ body: { content: "  " } });
    const res = ensureRes(makeRes());

    await postQuotes(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Contenu invalide",
    });
    expect(Quote.create).not.toHaveBeenCalled();
  });

  it("POST /quotes: 201 + author défaut", async () => {
    const { postQuotes } = await load();

    Quote.create.mockResolvedValue({ quoteID: 1 });

    const req = makeReq({ body: { content: "  hello  " } });
    const res = ensureRes(makeRes());

    await postQuotes(req as any, res as any);

    expect(Quote.create).toHaveBeenCalledWith({
      content: "hello",
      author: "Anonyme",
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ quoteID: 1 });
  });

  it("POST /quotes: catch -> 500", async () => {
    const { postQuotes } = await load();

    Quote.create.mockRejectedValue(new Error("boom"));

    const req = makeReq({ body: { content: "hello" } });
    const res = ensureRes(makeRes());

    await postQuotes(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur lors de l'ajout de la citation",
    });
  });

  it("PUT /quotes/:quoteID: 400 si ID invalide", async () => {
    const { putQuote } = await load();

    const req = makeReq({
      params: { quoteID: "NaN" },
      body: { content: "abc" },
    });
    const res = ensureRes(makeRes());

    await putQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "ID invalide",
    });
  });

  it("PUT /quotes/:quoteID: 400 si contenu invalide", async () => {
    const { putQuote } = await load();

    const req = makeReq({ params: { quoteID: "1" }, body: { content: "a" } });
    const res = ensureRes(makeRes());

    await putQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Contenu invalide",
    });
  });

  it("PUT /quotes/:quoteID: 404 si introuvable", async () => {
    const { putQuote } = await load();

    Quote.findByPk.mockResolvedValue(null);

    const req = makeReq({ params: { quoteID: "1" }, body: { content: "abc" } });
    const res = ensureRes(makeRes());

    await putQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Citation introuvable",
    });
  });

  it("PUT /quotes/:quoteID: success -> save + json", async () => {
    const { putQuote } = await load();

    const quote = {
      content: "",
      author: "",
      save: vi.fn().mockResolvedValue(undefined),
    };
    Quote.findByPk.mockResolvedValue(quote);

    const req = makeReq({
      params: { quoteID: "2" },
      body: { content: "  abc  ", author: "  Bob " },
    });
    const res = ensureRes(makeRes());

    await putQuote(req as any, res as any);

    expect(quote.content).toBe("abc");
    expect(quote.author).toBe("Bob");
    expect(quote.save).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith(quote);
  });

  it("PUT /quotes/:quoteID: catch -> 500", async () => {
    const { putQuote } = await load();

    Quote.findByPk.mockRejectedValue(new Error("boom"));

    const req = makeReq({ params: { quoteID: "1" }, body: { content: "abc" } });
    const res = ensureRes(makeRes());

    await putQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur lors de la mise à jour",
    });
  });

  it("DELETE /quotes/:quoteID: 400 si ID invalide", async () => {
    const { deleteQuote } = await load();

    const req = makeReq({ params: { quoteID: "NaN" } });
    const res = ensureRes(makeRes());

    await deleteQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "ID invalide",
    });
  });

  it("DELETE /quotes/:quoteID: 404 si rien supprimé", async () => {
    const { deleteQuote } = await load();

    Quote.destroy.mockResolvedValue(0);

    const req = makeReq({ params: { quoteID: "1" } });
    const res = ensureRes(makeRes());

    await deleteQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      code: "NOT_FOUND",
      message: "Citation introuvable",
    });
  });

  it("DELETE /quotes/:quoteID: 204 si supprimé", async () => {
    const { deleteQuote } = await load();

    Quote.destroy.mockResolvedValue(1);

    const req = makeReq({ params: { quoteID: "1" } });
    const res = ensureRes(makeRes());

    await deleteQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledTimes(1);
  });

  it("DELETE /quotes/:quoteID: catch -> 500", async () => {
    const { deleteQuote } = await load();

    Quote.destroy.mockRejectedValue(new Error("boom"));

    const req = makeReq({ params: { quoteID: "1" } });
    const res = ensureRes(makeRes());

    await deleteQuote(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur lors de la suppression",
    });
  });
});
