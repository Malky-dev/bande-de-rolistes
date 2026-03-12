import type { CookieOptions, NextFunction } from "express";
import Tokens from "csrf";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeNext, makeReq } from "@/../tests/helpers/express";
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

describe("middleware csrf", () => {
  const tokens = new Tokens();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete process.env.NODE_ENV;
  });

  describe("generateCsrfToken", () => {
    it("crée un secret s’il est absent, le stocke en cookie et retourne un token", () => {
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

    it("ne modifie pas le cookie si le secret est déjà présent et retourne un token", () => {
      const secret = tokens.secretSync();

      const req = makeReq({
        headers: { cookie: `csrf-secret=${encodeURIComponent(secret)}` },
      });

      const { res, cookieMock } = makeResWithCookie();

      const token = generateCsrfToken(req as any, res as any);

      expect(cookieMock).not.toHaveBeenCalled();
      expect(tokens.verify(secret, token)).toBe(true);
    });

    it("utilise secure=true en production", () => {
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
    it("retourne 403 si le secret CSRF est manquant", async () => {
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

    it("retourne 403 si le token est manquant dans le header x-csrf-token et dans body.csrfToken", async () => {
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

    it("retourne 403 si le token est invalide", async () => {
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

    it("appelle next avec un token valide provenant du header", async () => {
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

    it("appelle next avec un token valide provenant du body si le header est absent", async () => {
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

    it("retourne 403 si body.csrfToken n’est pas une chaîne", async () => {
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

    it("utilise le premier élément si x-csrf-token est un tableau", async () => {
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

describe("middleware csrf - gestion des erreurs", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("retourne 500 si une exception de type Error est levée", async () => {
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

  it("retourne 500 avec un message serveur générique si une exception non-Error est levée", async () => {
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
