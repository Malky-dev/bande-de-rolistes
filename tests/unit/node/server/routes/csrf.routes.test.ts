import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouterMock } from "./_routerMock";
import { makeReq, makeRes, makeNext } from "@/../tests/helpers/express";

const router = createRouterMock();

vi.mock("express", async () => {
  const actual = await vi.importActual<any>("express");
  return {
    ...actual,
    Router: () => router,
  };
});

const generateCsrfToken = vi.fn();
vi.mock("@/server/middleware/csrf", () => ({ generateCsrfToken }));

async function loadHandler() {
  vi.resetModules();

  router.get.mockClear();

  await import("@/server/routes/csrf");

  expect(router.get).toHaveBeenCalledTimes(1);
  expect(router.get).toHaveBeenCalledWith("/csrf-token", expect.any(Function));

  return router.get.mock.calls[0][1] as Function;
}

describe("routes/csrf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("200: set no-cache headers + renvoie {csrfToken}", async () => {
    const handler = await loadHandler();

    generateCsrfToken.mockReturnValue("token123");

    const req = makeReq();
    const res = makeRes();
    const next = makeNext();

    if (!("set" in res)) (res as any).set = vi.fn().mockReturnThis();

    await handler(req as any, res as any, next);

    expect((res as any).set).toHaveBeenCalledWith({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    expect(generateCsrfToken).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ csrfToken: "token123" });
    expect(res.status).not.toHaveBeenCalled();
  });

  it("500: si generateCsrfToken renvoie un token invalide (empty)", async () => {
    const handler = await loadHandler();

    generateCsrfToken.mockReturnValue("");

    const req = makeReq();
    const res = makeRes();
    if (!("set" in res)) (res as any).set = vi.fn().mockReturnThis();

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Token CSRF invalide",
    });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("500: si generateCsrfToken throw (message Error)", async () => {
    const handler = await loadHandler();

    generateCsrfToken.mockImplementation(() => {
      throw new Error("boom");
    });

    const req = makeReq();
    const res = makeRes();
    if (!("set" in res)) (res as any).set = vi.fn().mockReturnThis();

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "boom",
    });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("500: si throw non-Error -> message 'Erreur serveur'", async () => {
    const handler = await loadHandler();

    generateCsrfToken.mockImplementation(() => {
      throw "nope";
    });

    const req = makeReq();
    const res = makeRes();
    if (!("set" in res)) (res as any).set = vi.fn().mockReturnThis();

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await handler(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
