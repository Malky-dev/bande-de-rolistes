import { beforeEach, describe, expect, it, vi } from "vitest";

const rateLimitMock = vi.fn((opts: any) => opts);

vi.mock("express-rate-limit", () => ({
  default: rateLimitMock,
}));

describe("middleware rateLimit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("configure requestLimiter et authLimiter avec les options attendues", async () => {
    const constants = await import("@/server/constants");
    const mod = await import("@/server/middleware/rateLimit");

    expect(mod.requestLimiter).toBeDefined();
    expect(mod.authLimiter).toBeDefined();

    expect(rateLimitMock).toHaveBeenCalledTimes(2);

    const opts1 = rateLimitMock.mock.calls[0][0];
    const opts2 = rateLimitMock.mock.calls[1][0];

    const requestOpts = [opts1, opts2].find(
      (o) => o?.message === "Trop de tentatives, réessayez plus tard.",
    );
    const authOpts = [opts1, opts2].find(
      (o) =>
        o?.message === "Trop de tentatives de connexion, réessayez plus tard.",
    );

    expect(requestOpts).toBeTruthy();
    expect(authOpts).toBeTruthy();

    expect(requestOpts).toMatchObject({
      windowMs: constants.WINDOWMS,
      max: constants.RATELIMIT,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    });

    expect(authOpts).toMatchObject({
      windowMs: constants.WINDOWMS,
      max: constants.RATELIMIT,
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
    });
  });
});
