import { describe, expect, it, vi } from "vitest";

async function load() {
  vi.resetModules();
  vi.clearAllMocks();

  const requireAuth = vi.fn();
  const requireAdmin = vi.fn();
  const requireStaff = vi.fn();
  const requireAdminOrOwner = vi.fn();
  const requireRole = vi.fn();
  const verifyCsrf = vi.fn();
  const generateCsrfToken = vi.fn();
  const requestLimiter = vi.fn();

  vi.doMock("@/server/middleware/auth/requireAuth", () => ({
    __esModule: true,
    default: requireAuth,
  }));

  vi.doMock("@/server/middleware/auth/guards", () => ({
    requireAdmin,
    requireStaff,
    requireAdminOrOwner,
    requireRole,
  }));

  vi.doMock("@/server/middleware/csrf", () => ({
    verifyCsrf,
    generateCsrfToken,
  }));

  vi.doMock("@/server/middleware/rateLimit", () => ({
    requestLimiter,
  }));

  const mod = await import("@/server/middleware/index");

  return {
    mod,
    expected: {
      requireAuth,
      requireAdmin,
      requireStaff,
      requireAdminOrOwner,
      requireRole,
      verifyCsrf,
      generateCsrfToken,
      requestLimiter,
    },
  };
}

describe("middleware barrel", () => {
  it("réexporte chaque middleware depuis son module source", async () => {
    const { mod, expected } = await load();

    expect(mod.requireAuth).toBe(expected.requireAuth);
    expect(mod.requireAdmin).toBe(expected.requireAdmin);
    expect(mod.requireStaff).toBe(expected.requireStaff);
    expect(mod.requireAdminOrOwner).toBe(expected.requireAdminOrOwner);
    expect(mod.requireRole).toBe(expected.requireRole);
    expect(mod.verifyCsrf).toBe(expected.verifyCsrf);
    expect(mod.generateCsrfToken).toBe(expected.generateCsrfToken);
    expect(mod.requestLimiter).toBe(expected.requestLimiter);
  });
});
