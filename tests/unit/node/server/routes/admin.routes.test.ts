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

const adminUsersController = vi.fn();
const adminRolesController = vi.fn();
const adminUpdateRoleController = vi.fn();

vi.mock("@/server/controllers/admin/users", () => ({
  default: adminUsersController,
}));
vi.mock("@/server/controllers/admin/roles", () => ({
  default: adminRolesController,
}));
vi.mock("@/server/controllers/admin/updateRole", () => ({
  default: adminUpdateRoleController,
}));

const requestLimiter = vi.fn();

const requireAdminMw = vi.fn();
const requireAdmin = vi.fn(() => requireAdminMw);

const verifyCsrfMw = vi.fn();
const verifyCsrf = vi.fn(() => verifyCsrfMw);

vi.mock("@/server/middleware", () => ({
  requestLimiter,
  requireAdmin,
  verifyCsrf,
}));

describe("routes/admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.get.mockClear();
    router.put.mockClear();
    router.post.mockClear();
    router.use.mockClear();
  });

  it("déclare les routes admin avec les middlewares attendus", async () => {
    const mod = await import("@/server/routes/admin");
    expect(mod).toHaveProperty("default");

    expect(router.get).toHaveBeenCalledWith(
      "/admin/users",
      requestLimiter,
      requireAdminMw,
      adminUsersController,
    );

    expect(router.get).toHaveBeenCalledWith(
      "/admin/roles",
      requestLimiter,
      requireAdminMw,
      adminRolesController,
    );

    expect(router.put).toHaveBeenCalledWith(
      "/admin/users/:userID/role",
      requestLimiter,
      verifyCsrfMw,
      requireAdminMw,
      adminUpdateRoleController,
    );

    expect(requireAdmin).toHaveBeenCalledTimes(3);

    expect(verifyCsrf).toHaveBeenCalledTimes(1);
  });
});
