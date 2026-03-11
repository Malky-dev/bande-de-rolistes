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

const controllerListTables = vi.fn();
const controllerGetTable = vi.fn();
const controllerCreateTable = vi.fn();
const controllerUpdateTable = vi.fn();
const controllerUpdateStatus = vi.fn();
const controllerSignup = vi.fn();
const controllerUnsignup = vi.fn();

vi.mock("@/server/controllers/rpg/listTables", () => ({
  default: controllerListTables,
}));
vi.mock("@/server/controllers/rpg/getTable", () => ({
  default: controllerGetTable,
}));
vi.mock("@/server/controllers/rpg/createTable", () => ({
  default: controllerCreateTable,
}));
vi.mock("@/server/controllers/rpg/updateTable", () => ({
  default: controllerUpdateTable,
}));
vi.mock("@/server/controllers/rpg/updateStatus", () => ({
  default: controllerUpdateStatus,
}));
vi.mock("@/server/controllers/rpg/signup", () => ({
  default: controllerSignup,
}));
vi.mock("@/server/controllers/rpg/unsignup", () => ({
  default: controllerUnsignup,
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

describe("routes/rpg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.get.mockClear();
    router.post.mockClear();
    router.put.mockClear();
    router.delete.mockClear();
    router.use.mockClear();
  });

  it("déclare toutes les routes RPG avec les middlewares attendus", async () => {
    const mod = await import("@/server/routes/rpg");
    expect(mod).toHaveProperty("default");

    expect(router.get).toHaveBeenCalledWith(
      "/rpg/tables",
      requestLimiter,
      controllerListTables,
    );

    expect(router.get).toHaveBeenCalledWith(
      "/rpg/tables/:eventID",
      requestLimiter,
      controllerGetTable,
    );

    expect(router.post).toHaveBeenCalledWith(
      "/rpg/tables",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerCreateTable,
    );

    expect(router.put).toHaveBeenCalledWith(
      "/rpg/tables/:eventID",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerUpdateTable,
    );

    expect(router.put).toHaveBeenCalledWith(
      "/rpg/tables/:eventID/status",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerUpdateStatus,
    );

    expect(router.post).toHaveBeenCalledWith(
      "/rpg/tables/:eventID/signup",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerSignup,
    );

    expect(router.delete).toHaveBeenCalledWith(
      "/rpg/tables/:eventID/signup",
      requestLimiter,
      verifyCsrfMw,
      requireAuth,
      controllerUnsignup,
    );

    expect(verifyCsrf).toHaveBeenCalledTimes(5);
  });
});
