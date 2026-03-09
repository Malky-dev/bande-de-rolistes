import { describe, it, expect, vi } from "vitest";

describe("server/global", () => {
  it("hashPassword + comparePassword utilisent bcrypt", async () => {
    vi.resetModules();

    const bcryptHash = vi.fn().mockResolvedValue("hashed");
    const bcryptCompare = vi.fn().mockResolvedValue(true);

    vi.doMock("bcrypt", () => ({
      default: {
        hash: bcryptHash,
        compare: bcryptCompare,
      },
    }));

    const mod = await import("@/server/global");
    const hash = await mod.hashPassword("secret");
    const ok = await mod.comparePassword("secret", "hashed");

    expect(hash).toBe("hashed");
    expect(ok).toBe(true);
    expect(bcryptHash).toHaveBeenCalled();
    expect(bcryptCompare).toHaveBeenCalled();
  });

  it("generateSessionToken renvoie 64 chars hex", async () => {
    vi.resetModules();

    const mod = await import("@/server/global");
    const t = mod.generateSessionToken();

    expect(typeof t).toBe("string");
    expect(t.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(t)).toBe(true);
  });
});
