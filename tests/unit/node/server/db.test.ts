import { describe, it, expect, vi } from "vitest";

describe("server/db", () => {
  it("log le succès si authenticate resolve", async () => {
    vi.resetModules();

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const dotenvConfig = vi.fn();
    const authenticate = vi.fn().mockResolvedValue(undefined);

    vi.doMock("dotenv", () => ({ default: { config: dotenvConfig } }));

    class SequelizeMock {
      authenticate = authenticate;
    }

    vi.doMock("sequelize", () => ({ Sequelize: SequelizeMock }));

    await import("@/server/db");

    expect(dotenvConfig).toHaveBeenCalledTimes(1);
    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalled();

    errSpy.mockRestore();
    logSpy.mockRestore();
  });

  it("log l'erreur si authenticate reject", async () => {
    vi.resetModules();

    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    vi.doMock("dotenv", () => ({ default: { config: vi.fn() } }));

    class SequelizeMock {
      authenticate() {
        return Promise.reject(new Error("db down"));
      }
    }

    vi.doMock("sequelize", () => ({ Sequelize: SequelizeMock }));

    await import("@/server/db");

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
    logSpy.mockRestore();
  });
});
