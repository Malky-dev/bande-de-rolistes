import { describe, it, expect, vi, beforeEach } from "vitest";

import { makeReq, makeRes, makeNext } from "@/../tests/helpers/express";

vi.mock("@/server/middleware/auth/requireAuth", () => ({
  default: vi.fn((_req: any, _res: any, next: any) => next()),
}));

import requireAuth from "@/server/middleware/auth/requireAuth";
import {
  requireRole,
  requireAdmin,
  requireStaff,
  requireAdminOrOwner,
} from "@/server/middleware/auth/guards";

describe("auth guards", () => {
  const requireAuthMock = vi.mocked(requireAuth);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("requireRole", () => {
    it("403 si le rôle ne correspond pas", () => {
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

    it("next si le rôle correspond", () => {
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
    it("403 si pas admin", () => {
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

    it("next si admin", () => {
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
    it("403 si ni admin ni organisator", () => {
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

    it("next si admin", () => {
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

    it("next si organisator", () => {
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
    it("400 si param userID invalide (non entier / <= 0)", () => {
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

    it("403 si ni admin ni owner", () => {
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

    it("next si admin (même si pas owner)", () => {
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

    it("next si owner (même si pas admin)", () => {
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

    it("utilise le paramName custom", () => {
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
