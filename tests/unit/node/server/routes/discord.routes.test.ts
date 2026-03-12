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

const controllerDiscordInit = vi.fn();
const controllerDiscordCallback = vi.fn();

vi.mock("@/server/controllers/discord", () => ({
  controllerDiscordInit,
  controllerDiscordCallback,
}));

const requestLimiter = vi.fn();
vi.mock("@/server/middleware/rateLimit", () => ({ requestLimiter }));

describe("routes discord", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.get.mockClear();
    router.post.mockClear();
    router.use.mockClear();
  });

  it("déclare GET /discord/init et GET /discord/callback avec requestLimiter", async () => {
    const mod = await import("@/server/routes/discord");
    expect(mod).toHaveProperty("default");

    expect(router.get).toHaveBeenCalledTimes(2);

    expect(router.get).toHaveBeenCalledWith(
      "/discord/init",
      requestLimiter,
      controllerDiscordInit,
    );

    expect(router.get).toHaveBeenCalledWith(
      "/discord/callback",
      requestLimiter,
      controllerDiscordCallback,
    );
  });
});
