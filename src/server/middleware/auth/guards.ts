import type { RequestHandler, Response } from "express";
import requireAuth from "./requireAuth";

function forbidden(res: Response, message: string): void {
  res.status(403).json({ code: "FORBIDDEN", message });
}

export function requireRole(roleLabel: string): RequestHandler {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const role = req.user!.role!.roleLabel;
      if (role !== roleLabel) {
        return forbidden(res, `${roleLabel} access required`);
      }
      next();
    });
  };
}

export const requireAdmin = (): RequestHandler => requireRole("admin");

export const requireStaff = (): RequestHandler => {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const role = req.user!.role!.roleLabel;
      if (role !== "admin" && role !== "organisator") {
        return forbidden(res, "Accès réservé admin/organisateur");
      }
      next();
    });
  };
};

export const requireAdminOrOwner = (
  paramName: string = "userID",
): RequestHandler => {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const targetUserID = Number(req.params[paramName]);
      if (!Number.isInteger(targetUserID) || targetUserID <= 0) {
        res
          .status(400)
          .json({ code: "BAD_USER_ID", message: `Invalid ${paramName}` });
        return;
      }

      const isAdmin = req.user!.role!.roleLabel === "admin";
      const isOwner = req.user!.userID === targetUserID;

      if (!isAdmin && !isOwner) return forbidden(res, "Admin or owner only");

      next();
    });
  };
};
