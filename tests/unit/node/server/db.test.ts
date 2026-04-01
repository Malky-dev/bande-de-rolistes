import { describe, it, expect, vi } from "vitest";

describe("configuration de la base de données", () => {
  it("charge dotenv et construit une instance Sequelize sans authentifier à l'import", async () => {
    vi.resetModules();

    const dotenvConfig = vi.fn();
    const authenticate = vi.fn();
    const SequelizeMock = vi.fn(function SequelizeMock(this: object) {
      Object.assign(this, { authenticate });
    });

    vi.doMock("dotenv", () => ({ default: { config: dotenvConfig } }));
    vi.doMock("sequelize", () => ({ Sequelize: SequelizeMock }));

    const mod = await import("@/server/db");

    expect(dotenvConfig).toHaveBeenCalledTimes(1);
    expect(SequelizeMock).toHaveBeenCalledTimes(1);
    expect(authenticate).not.toHaveBeenCalled();
    expect(mod.default).toBeDefined();
  });
});
