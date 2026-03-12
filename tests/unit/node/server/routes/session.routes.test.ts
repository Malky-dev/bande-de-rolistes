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

const sessionController = vi.fn();
vi.mock("@/server/controllers/session", () => ({ default: sessionController }));

const requestLimiter = vi.fn();
vi.mock("@/server/middleware/rateLimit", () => ({ requestLimiter }));

describe("routes session", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.get.mockClear();
    router.post.mockClear();
    router.use.mockClear();
  });

  it("déclare GET /session avec requestLimiter et sessionController", async () => {
    const mod = await import("@/server/routes/session");
    expect(mod).toHaveProperty("default");

    expect(router.get).toHaveBeenCalledTimes(1);
    expect(router.get).toHaveBeenCalledWith(
      "/session",
      requestLimiter,
      sessionController,
    );
  });
});
