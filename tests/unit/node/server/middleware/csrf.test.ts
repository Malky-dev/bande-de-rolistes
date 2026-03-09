import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextFunction, CookieOptions } from "express";
import Tokens from "csrf";

import { makeReq, makeNext } from "@/../tests/helpers/express";
import { generateCsrfToken, verifyCsrf } from "@/server/middleware/csrf";

type CookieSetter = (
  name: string,
  value: string,
  options: CookieOptions,
) => void;

function makeResWithCookie() {
  const status = vi.fn().mockReturnThis();
  const json = vi.fn().mockReturnThis();
  const cookie = vi.fn<CookieSetter>();

  return {
    res: { status, json, cookie },
    cookieMock: cookie,
  };
}

describe("csrf middleware", () => {
  const tokens = new Tokens();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe("generateCsrfToken", () => {
    it("crée un secret si absent, le stocke en cookie, et renvoie un token", () => {
      process.env.NODE_ENV = "test";

      const req = makeReq({ headers: { cookie: "" } });
      const { res, cookieMock } = makeResWithCookie();

      const token = generateCsrfToken(req as any, res as any);

      expect(typeof token).toBe("string");
      expect(token.length).toBeGreaterThan(0);

      expect(cookieMock).toHaveBeenCalledTimes(1);

      const [name, secret, options] = cookieMock.mock.calls[0] as [
        string,
        string,
        CookieOptions,
      ];

      expect(name).toBe("csrf-secret");
      expect(typeof secret).toBe("string");
      expect(secret.length).toBeGreaterThan(0);

      expect(options).toMatchObject({
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      });

      expect(tokens.verify(secret, token)).toBe(true);
    });

    it("ne touche pas au cookie si secret déjà présent et renvoie un token", () => {
      const secret = tokens.secretSync();

      const req = makeReq({
        headers: { cookie: `csrf-secret=${encodeURIComponent(secret)}` },
      });

      const { res, cookieMock } = makeResWithCookie();

      const token = generateCsrfToken(req as any, res as any);

      expect(cookieMock).not.toHaveBeenCalled();
      expect(tokens.verify(secret, token)).toBe(true);
    });

    it("met secure=true en production", () => {
      process.env.NODE_ENV = "production";

      const req = makeReq({ headers: { cookie: "" } });
      const { res, cookieMock } = makeResWithCookie();

      generateCsrfToken(req as any, res as any);

      expect(cookieMock).toHaveBeenCalledTimes(1);
      const [, , options] = cookieMock.mock.calls[0] as [
        string,
        string,
        CookieOptions,
      ];

      expect(options.secure).toBe(true);
    });
  });

  describe("verifyCsrf", () => {
    it("403 si secret CSRF manquant", async () => {
      const mw = verifyCsrf();
      const req = makeReq({ headers: {} });
      const { res } = makeResWithCookie();
      const next = makeNext() as NextFunction;

      await mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message:
          "Secret CSRF manquant. Veuillez récupérer un token CSRF d'abord.",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("403 si token manquant (ni header x-csrf-token, ni body csrfToken)", async () => {
      const mw = verifyCsrf();
      const secret = tokens.secretSync();

      const req = makeReq({
        headers: { cookie: `csrf-secret=${encodeURIComponent(secret)}` },
        body: {},
      });

      const { res } = makeResWithCookie();
      const next = makeNext() as NextFunction;

      await mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "Token CSRF manquant (header x-csrf-token ou body csrfToken).",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("403 si token invalide", async () => {
      const mw = verifyCsrf();
      const secret = tokens.secretSync();

      const req = makeReq({
        headers: {
          cookie: `csrf-secret=${encodeURIComponent(secret)}`,
          "x-csrf-token": "totally-wrong-token",
        },
        body: {},
      });

      const { res } = makeResWithCookie();
      const next = makeNext() as NextFunction;

      await mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "Token CSRF invalide",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("passe (next) avec token valide depuis le header", async () => {
      const mw = verifyCsrf();
      const secret = tokens.secretSync();
      const token = tokens.create(secret);

      const req = makeReq({
        headers: {
          cookie: `csrf-secret=${encodeURIComponent(secret)}`,
          "x-csrf-token": token,
        },
        body: {},
      });

      const { res } = makeResWithCookie();
      const next = makeNext() as NextFunction;

      await mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("passe (next) avec token valide depuis le body (csrfToken) si header absent", async () => {
      const mw = verifyCsrf();
      const secret = tokens.secretSync();
      const token = tokens.create(secret);

      const req = makeReq({
        headers: { cookie: `csrf-secret=${encodeURIComponent(secret)}` },
        body: { csrfToken: token },
      });

      const { res } = makeResWithCookie();
      const next = makeNext() as NextFunction;

      await mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("403 si csrfToken body n'est pas une string", async () => {
      const mw = verifyCsrf();
      const secret = tokens.secretSync();

      const req = makeReq({
        headers: { cookie: `csrf-secret=${encodeURIComponent(secret)}` },
        body: { csrfToken: 123 },
      });

      const { res } = makeResWithCookie();
      const next = makeNext() as NextFunction;

      await mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "Token CSRF manquant (header x-csrf-token ou body csrfToken).",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("prend le premier élément si x-csrf-token est un tableau", async () => {
      const mw = verifyCsrf();
      const secret = tokens.secretSync();
      const token = tokens.create(secret);

      const req = makeReq({
        headers: {
          cookie: `csrf-secret=${encodeURIComponent(secret)}`,
          "x-csrf-token": [token, "ignored"] as any,
        },
        body: {},
      });

      const { res } = makeResWithCookie();
      const next = makeNext() as NextFunction;

      await mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });
});

describe("verifyCsrf - error handling", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("500 si une exception est levée (catch)", async () => {
    vi.doMock("@/server/utils/cookies", () => ({
      getCookieValue: vi.fn(() => {
        throw new Error("boom");
      }),
    }));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { verifyCsrf } = await import("@/server/middleware/csrf");

    const mw = verifyCsrf();

    const req = makeReq({ headers: {} });
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const cookie = vi.fn();

    const res = { status, json, cookie };
    const next = vi.fn();

    await mw(req as any, res as any, next as any);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({ code: "ERROR", message: "boom" });
    expect(next).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("500 si une exception non-Error est levée (catch)", async () => {
    vi.doMock("@/server/utils/cookies", () => ({
      getCookieValue: vi.fn(() => {
        throw "nope";
      }),
    }));

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { verifyCsrf } = await import("@/server/middleware/csrf");

    const mw = verifyCsrf();

    const req = makeReq({ headers: {} });
    const status = vi.fn().mockReturnThis();
    const json = vi.fn().mockReturnThis();
    const cookie = vi.fn();

    const res = { status, json, cookie };
    const next = vi.fn();

    await mw(req as any, res as any, next as any);

    expect(status).toHaveBeenCalledWith(500);
    expect(json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });
    expect(next).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
