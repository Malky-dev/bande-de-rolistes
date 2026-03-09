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

const signinController = vi.fn();
const loginController = vi.fn();

vi.mock("@/server/controllers/signin", () => ({ default: signinController }));
vi.mock("@/server/controllers/login", () => ({ default: loginController }));

const requestLimiter = vi.fn();
vi.mock("@/server/middleware/rateLimit", () => ({ requestLimiter }));

const verifyCsrfMw = vi.fn();
const verifyCsrf = vi.fn(() => verifyCsrfMw);
vi.mock("@/server/middleware/csrf", () => ({ verifyCsrf }));

describe("routes/auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    router.post.mockClear();
    router.get.mockClear();
    router.use.mockClear();
  });

  it("déclare POST /auth/signin et POST /auth/login avec les middlewares attendus", async () => {
    const mod = await import("@/server/routes/auth");
    expect(mod).toHaveProperty("default");

    expect(router.post).toHaveBeenCalledTimes(2);

    expect(router.post).toHaveBeenCalledWith(
      "/auth/signin",
      requestLimiter,
      expect.any(Function),
      signinController,
    );

    expect(router.post).toHaveBeenCalledWith(
      "/auth/login",
      requestLimiter,
      expect.any(Function),
      loginController,
    );

    expect(verifyCsrf).toHaveBeenCalledTimes(2);
  });
});
