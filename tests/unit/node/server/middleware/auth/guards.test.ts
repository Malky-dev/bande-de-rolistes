import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeNext, makeReq, makeRes } from "@/../tests/helpers/express";

vi.mock("@/server/middleware/auth/requireAuth", () => ({
  default: vi.fn((_req: any, _res: any, next: any) => next()),
}));

import requireAuth from "@/server/middleware/auth/requireAuth";
import {
  requireAdmin,
  requireAdminOrOwner,
  requireRole,
  requireStaff,
} from "@/server/middleware/auth/guards";

describe("guards auth", () => {
  const requireAuthMock = vi.mocked(requireAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireRole", () => {
    it("retourne 403 si le rôle ne correspond pas", () => {
      const mw = requireRole("admin");

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: 2, roleLabel: "member" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(requireAuthMock).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "admin access required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("appelle next si le rôle correspond", () => {
      const mw = requireRole("admin");

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: 1, roleLabel: "admin" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(requireAuthMock).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("requireAdmin", () => {
    it("retourne 403 si l’utilisateur n’est pas admin", () => {
      const mw = requireAdmin();

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: 2, roleLabel: "organisator" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "admin access required",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("appelle next si l’utilisateur est admin", () => {
      const mw = requireAdmin();

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: 1, roleLabel: "admin" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });
  });

  describe("requireStaff", () => {
    it("retourne 403 si l’utilisateur n’est ni admin ni organisateur", () => {
      const mw = requireStaff();

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: 3, roleLabel: "member" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "Accès réservé admin/organisateur",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("retourne 403 si roleID est absent ou invalide", () => {
      const mw = requireStaff();

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: "2" as any, roleLabel: "organisator" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "Accès réservé admin/organisateur",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("appelle next si l’utilisateur est admin", () => {
      const mw = requireStaff();

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: 1, roleLabel: "admin" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
    });

    it("appelle next si l’utilisateur est organisateur", () => {
      const mw = requireStaff();

      const req = makeReq({
        user: {
          userID: 1,
          nickname: "x",
          role: { roleID: 2, roleLabel: "organisator" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });

  describe("requireAdminOrOwner", () => {
    it("retourne 400 si le paramètre userID est invalide", () => {
      const mw = requireAdminOrOwner();

      const req = makeReq({
        params: { userID: "0" } as any,
        user: {
          userID: 99,
          nickname: "x",
          role: { roleID: 2, roleLabel: "member" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        code: "BAD_USER_ID",
        message: "Invalid userID",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("retourne 401 si le userID de session n’est pas un nombre", () => {
      const mw = requireAdminOrOwner();

      const req = makeReq({
        params: { userID: "10" } as any,
        user: {
          userID: "10" as any,
          nickname: "x",
          role: { roleID: 2, roleLabel: "member" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("retourne 403 si l’utilisateur n’est ni admin ni propriétaire", () => {
      const mw = requireAdminOrOwner();

      const req = makeReq({
        params: { userID: "10" } as any,
        user: {
          userID: 9,
          nickname: "x",
          role: { roleID: 2, roleLabel: "member" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        code: "FORBIDDEN",
        message: "Admin or owner only",
      });
      expect(next).not.toHaveBeenCalled();
    });

    it("appelle next si l’utilisateur est admin même s’il n’est pas propriétaire", () => {
      const mw = requireAdminOrOwner();

      const req = makeReq({
        params: { userID: "10" } as any,
        user: {
          userID: 9,
          nickname: "x",
          role: { roleID: 1, roleLabel: "admin" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("appelle next si l’utilisateur est propriétaire même s’il n’est pas admin", () => {
      const mw = requireAdminOrOwner();

      const req = makeReq({
        params: { userID: "10" } as any,
        user: {
          userID: 10,
          nickname: "x",
          role: { roleID: 2, roleLabel: "member" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it("utilise le nom de paramètre personnalisé", () => {
      const mw = requireAdminOrOwner("id");

      const req = makeReq({
        params: { id: "42" } as any,
        user: {
          userID: 42,
          nickname: "x",
          role: { roleID: 2, roleLabel: "member" },
        },
      });
      const res = makeRes();
      const next = makeNext();

      mw(req as any, res as any, next);

      expect(next).toHaveBeenCalledTimes(1);
    });
  });
});
