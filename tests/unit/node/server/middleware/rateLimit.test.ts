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

  it("configure requestLimiter avec les options attendues", async () => {
    const constants = await import("@/server/constants");
    const mod = await import("@/server/middleware/rateLimit");

    expect(mod.requestLimiter).toBeDefined();
    expect(rateLimitMock).toHaveBeenCalledTimes(1);

    const requestOpts = rateLimitMock.mock.calls[0][0];

    expect(requestOpts).toMatchObject({
      windowMs: constants.WINDOWMS,
      max: constants.RATELIMIT,
      message: "Trop de tentatives, réessayez plus tard.",
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
    });
  });
});
