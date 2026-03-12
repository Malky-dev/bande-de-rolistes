import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeNext, makeReq, makeRes } from "@/../tests/helpers/express";
import { createRouterMock } from "./_routerMock";

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

describe("routes csrf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("retourne 200, définit les en-têtes anti-cache et renvoie { csrfToken }", async () => {
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

  it("retourne 500 si generateCsrfToken renvoie un token invalide vide", async () => {
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

  it("retourne 500 avec le message de l’erreur si generateCsrfToken lève une Error", async () => {
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

  it("retourne 500 avec un message serveur générique si l’erreur n’est pas une Error", async () => {
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
