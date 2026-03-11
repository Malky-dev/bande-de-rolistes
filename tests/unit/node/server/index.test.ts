import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const flushPromises = () => new Promise<void>((r) => setImmediate(() => r()));

describe("server/index.ts bootstrap", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.PORT;
    delete process.env.FRONTEND_URL;
  });

  it("branche success: initDatabase OK -> listen est appelé et routes montées", async () => {
    process.env.PORT = "4242";
    process.env.FRONTEND_URL = "http://frontend.test";

    const appUse = vi.fn();
    const appListen = vi.fn((port: number, cb?: () => void) => cb?.());

    const expressDefault: any = vi.fn(() => ({
      use: appUse,
      listen: appListen,
    }));

    expressDefault.json = vi.fn(() => "express.json");

    vi.doMock("express", () => ({
      default: expressDefault,
    }));

    const corsMw = { _mw: "cors" };
    const helmetMw = { _mw: "helmet" };
    const compressionMw = { _mw: "compression" };

    const corsFn = vi.fn((_opts: any) => corsMw);
    const helmetFn = vi.fn((_opts: any) => helmetMw);
    const compressionFn = vi.fn(() => compressionMw);

    vi.doMock("cors", () => ({ default: corsFn }));
    vi.doMock("helmet", () => ({ default: helmetFn }));
    vi.doMock("compression", () => ({ default: compressionFn }));

    const dotenvConfig = vi.fn();
    vi.doMock("dotenv", () => ({ default: { config: dotenvConfig } }));

    const authenticate = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@/server/db", () => ({
      default: { authenticate, sync },
    }));

    const mkRouter = (name: string) => ({ _router: name });

    vi.doMock("@/server/routes/auth", () => ({ default: mkRouter("auth") }));
    vi.doMock("@/server/routes/session", () => ({
      default: mkRouter("session"),
    }));
    vi.doMock("@/server/routes/csrf", () => ({ default: mkRouter("csrf") }));
    vi.doMock("@/server/routes/discord", () => ({
      default: mkRouter("discord"),
    }));
    vi.doMock("@/server/routes/admin", () => ({ default: mkRouter("admin") }));
    vi.doMock("@/server/routes/account", () => ({
      default: mkRouter("account"),
    }));
    vi.doMock("@/server/routes/rpg", () => ({ default: mkRouter("rpg") }));
    vi.doMock("@/server/routes/quote", () => ({ default: mkRouter("quote") }));
    vi.doMock("@/server/routes/quotes", () => ({
      default: mkRouter("quotes"),
    }));
    vi.doMock("@/server/routes/cotisation", () => ({
      default: mkRouter("cotisation"),
    }));

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: number,
    ) => {
      return undefined as never;
    }) as any);

    await import("@/server/index");
    await flushPromises();

    expect(dotenvConfig).toHaveBeenCalledTimes(1);

    expect(expressDefault).toHaveBeenCalledTimes(1);
    expect(expressDefault.json).toHaveBeenCalledTimes(1);

    expect(corsFn).toHaveBeenCalledTimes(1);
    expect(corsFn).toHaveBeenCalledWith({
      origin: "http://frontend.test",
      credentials: true,
    });

    expect(appUse).toHaveBeenCalledWith(corsMw);
    expect(appUse).toHaveBeenCalledWith("express.json");
    expect(appUse).toHaveBeenCalledWith(helmetMw);
    expect(appUse).toHaveBeenCalledWith(compressionMw);

    const usesApi = appUse.mock.calls.filter((c) => c[0] === "/api");
    expect(usesApi.length).toBe(10);

    expect(authenticate).toHaveBeenCalledTimes(1);
    expect(sync).toHaveBeenCalledTimes(1);

    expect(appListen).toHaveBeenCalledTimes(1);
    expect(appListen).toHaveBeenCalledWith(4242, expect.any(Function));

    expect(errSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();

    expect(logSpy).toHaveBeenCalled();

    logSpy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("branche error: initDatabase KO -> console.error + process.exit(1)", async () => {
    process.env.PORT = "3001";

    const appUse = vi.fn();
    const appListen = vi.fn();

    const expressDefault: any = vi.fn(() => ({
      use: appUse,
      listen: appListen,
    }));

    expressDefault.json = vi.fn(() => "express.json");

    vi.doMock("express", () => ({
      default: expressDefault,
    }));

    vi.doMock("cors", () => ({ default: vi.fn(() => "cors") }));
    vi.doMock("helmet", () => ({ default: vi.fn(() => "helmet") }));
    vi.doMock("compression", () => ({ default: vi.fn(() => "compression") }));
    vi.doMock("dotenv", () => ({ default: { config: vi.fn() } }));

    const boom = new Error("db down");
    const authenticate = vi.fn().mockRejectedValue(boom);
    const sync = vi.fn();

    vi.doMock("@/server/db", () => ({
      default: { authenticate, sync },
    }));

    const mkRouter = (name: string) => ({ _router: name });
    vi.doMock("@/server/routes/auth", () => ({ default: mkRouter("auth") }));
    vi.doMock("@/server/routes/session", () => ({
      default: mkRouter("session"),
    }));
    vi.doMock("@/server/routes/csrf", () => ({ default: mkRouter("csrf") }));
    vi.doMock("@/server/routes/discord", () => ({
      default: mkRouter("discord"),
    }));
    vi.doMock("@/server/routes/admin", () => ({ default: mkRouter("admin") }));
    vi.doMock("@/server/routes/account", () => ({
      default: mkRouter("account"),
    }));
    vi.doMock("@/server/routes/rpg", () => ({ default: mkRouter("rpg") }));
    vi.doMock("@/server/routes/quote", () => ({ default: mkRouter("quote") }));
    vi.doMock("@/server/routes/quotes", () => ({
      default: mkRouter("quotes"),
    }));
    vi.doMock("@/server/routes/cotisation", () => ({
      default: mkRouter("cotisation"),
    }));

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: number,
    ) => {
      return undefined as never;
    }) as any);

    await import("@/server/index");
    await flushPromises();

    expect(appListen).not.toHaveBeenCalled();

    expect(errSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);

    const errArgs = errSpy.mock.calls.flat();
    expect(errArgs).toContain(boom);

    logSpy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it("utilise les valeurs par défaut pour PORT et FRONTEND_URL", async () => {
    const appUse = vi.fn();
    const appListen = vi.fn((port: number, cb?: () => void) => cb?.());

    const expressDefault: any = vi.fn(() => ({
      use: appUse,
      listen: appListen,
    }));

    expressDefault.json = vi.fn(() => "express.json");

    vi.doMock("express", () => ({
      default: expressDefault,
    }));

    const corsMw = { _mw: "cors" };

    const corsFn = vi.fn((_opts: unknown) => corsMw);
    vi.doMock("cors", () => ({ default: corsFn }));
    vi.doMock("helmet", () => ({ default: vi.fn(() => "helmet") }));
    vi.doMock("compression", () => ({ default: vi.fn(() => "compression") }));
    vi.doMock("dotenv", () => ({ default: { config: vi.fn() } }));

    const authenticate = vi.fn().mockResolvedValue(undefined);
    const sync = vi.fn().mockResolvedValue(undefined);

    vi.doMock("@/server/db", () => ({
      default: { authenticate, sync },
    }));

    const mkRouter = (name: string) => ({ _router: name });
    vi.doMock("@/server/routes/auth", () => ({ default: mkRouter("auth") }));
    vi.doMock("@/server/routes/session", () => ({
      default: mkRouter("session"),
    }));
    vi.doMock("@/server/routes/csrf", () => ({ default: mkRouter("csrf") }));
    vi.doMock("@/server/routes/discord", () => ({
      default: mkRouter("discord"),
    }));
    vi.doMock("@/server/routes/admin", () => ({ default: mkRouter("admin") }));
    vi.doMock("@/server/routes/account", () => ({
      default: mkRouter("account"),
    }));
    vi.doMock("@/server/routes/rpg", () => ({ default: mkRouter("rpg") }));
    vi.doMock("@/server/routes/quote", () => ({ default: mkRouter("quote") }));
    vi.doMock("@/server/routes/quotes", () => ({
      default: mkRouter("quotes"),
    }));
    vi.doMock("@/server/routes/cotisation", () => ({
      default: mkRouter("cotisation"),
    }));

    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(((
      _code?: number,
    ) => {
      return undefined as never;
    }) as any);

    await import("@/server/index");
    await flushPromises();

    expect(corsFn).toHaveBeenCalledWith({
      origin: "http://localhost:5173",
      credentials: true,
    });
    expect(appListen).toHaveBeenCalledWith(3000, expect.any(Function));
    expect(errSpy).not.toHaveBeenCalled();
    expect(exitSpy).not.toHaveBeenCalled();

    logSpy.mockRestore();
    errSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
