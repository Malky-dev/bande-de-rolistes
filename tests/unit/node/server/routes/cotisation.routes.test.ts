import { describe, it, expect, vi, beforeEach } from "vitest";
import { createRouterMock } from "./_routerMock";

const router = createRouterMock();

vi.mock("express", async () => {
  const actual = await vi.importActual<any>("express");
  return {
    ...actual,
    Router: () => router,
  };
});

const createCotisation = vi.fn();
const getCotisationStatus = vi.fn();
const listCotisations = vi.fn();

vi.mock("@/server/controllers/cotisation", () => ({
  createCotisation,
  getCotisationStatus,
  listCotisations,
}));

const requestLimiter = vi.fn();

const requireAdminMw = vi.fn();
const requireAdmin = vi.fn(() => requireAdminMw);

const requireAdminOrOwnerMw = vi.fn();
const requireAdminOrOwner = vi.fn(() => requireAdminOrOwnerMw);

const verifyCsrfMw = vi.fn();
const verifyCsrf = vi.fn(() => verifyCsrfMw);

vi.mock("@/server/middleware", () => ({
  requestLimiter,
  requireAdmin,
  requireAdminOrOwner,
  verifyCsrf,
}));

describe("routes/cotisation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.get.mockClear();
    router.post.mockClear();
    router.put.mockClear();
    router.delete.mockClear();
    router.use.mockClear();
  });

  it("déclare les routes cotisation avec les middlewares attendus", async () => {
    const mod = await import("@/server/routes/cotisation");
    expect(mod).toHaveProperty("default");

    expect(router.get).toHaveBeenCalledWith(
      "/users/:userID/cotisations",
      requestLimiter,
      requireAdminOrOwnerMw,
      listCotisations,
    );

    expect(router.get).toHaveBeenCalledWith(
      "/users/:userID/cotisations/status",
      requestLimiter,
      requireAdminOrOwnerMw,
      getCotisationStatus,
    );

    expect(router.post).toHaveBeenCalledWith(
      "/users/:userID/cotisations",
      requestLimiter,
      verifyCsrfMw,
      requireAdminMw,
      createCotisation,
    );

    expect(requireAdminOrOwner).toHaveBeenCalledTimes(2);
    expect(requireAdminOrOwner).toHaveBeenCalledWith("userID");

    expect(verifyCsrf).toHaveBeenCalledTimes(1);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
  });
});
