import { beforeEach, describe, expect, it, vi } from "vitest";

import { createRouterMock } from "./_routerMock";

const router = createRouterMock();

vi.mock("express", async () => {
  const actual = await vi.importActual<any>("express");
  return {
    ...actual,
    Router: () => router,
  };
});

const controllerGetAccount = vi.fn();
const controllerUpdateAccount = vi.fn();

vi.mock("@/server/controllers/account/getAccount", () => ({
  default: controllerGetAccount,
}));
vi.mock("@/server/controllers/account/updateAccount", () => ({
  default: controllerUpdateAccount,
}));

const requestLimiter = vi.fn();
const requireAuth = vi.fn();

const verifyCsrfMw = vi.fn();
const verifyCsrf = vi.fn(() => verifyCsrfMw);

vi.mock("@/server/middleware", () => ({
  requestLimiter,
  requireAuth,
  verifyCsrf,
}));

describe("routes account", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.get.mockClear();
    router.put.mockClear();
    router.post.mockClear();
    router.use.mockClear();
  });

  it("déclare GET /account et PUT /account avec les middlewares attendus", async () => {
    const mod = await import("@/server/routes/account");
    expect(mod).toHaveProperty("default");

    expect(router.get).toHaveBeenCalledTimes(1);
    expect(router.get).toHaveBeenCalledWith(
      "/account",
      requestLimiter,
      requireAuth,
      controllerGetAccount,
    );

    expect(router.put).toHaveBeenCalledTimes(1);
    expect(router.put).toHaveBeenCalledWith(
      "/account",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerUpdateAccount,
    );

    expect(verifyCsrf).toHaveBeenCalledTimes(1);
  });
});
