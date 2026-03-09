import { describe, it, expect, vi } from "vitest";

describe("server/db", () => {
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
