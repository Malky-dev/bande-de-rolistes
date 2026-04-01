import type { Request, RequestHandler, Response } from "express";
import requireAuth from "./requireAuth";
import { RPG_ADMIN_OR_ORGA_ROLE_IDS } from "../../../shared/constants";

function forbidden(res: Response, message: string): void {
  res.status(403).json({ code: "FORBIDDEN", message });
}

function unauthorized(res: Response): void {
  res.status(401).json({
    code: "UNAUTHORIZED",
    message: "Not authenticated",
  });
}

function getRoleID(req: Request): number | null {
  const roleID = req.user?.role?.roleID;
  return typeof roleID === "number" ? roleID : null;
}

function getUserID(req: Request): number | null {
  const userID = req.user?.userID;
  return typeof userID === "number" ? userID : null;
}

function hasAllowedRole(
  req: Request,
  allowedRoleIDs: readonly number[],
): boolean {
  const roleID = getRoleID(req);
  if (roleID === null) {
    return false;
  }

  return allowedRoleIDs.includes(roleID);
}

export function requireRole(roleLabel: string): RequestHandler {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const role = req.user?.role?.roleLabel;
      if (role !== roleLabel) {
        forbidden(res, `${roleLabel} access required`);
        return;
      }

      next();
    });
  };
}

export const requireAdmin = (): RequestHandler => requireRole("admin");

export const requireStaff = (): RequestHandler => {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!hasAllowedRole(req, RPG_ADMIN_OR_ORGA_ROLE_IDS)) {
        forbidden(res, "Accès réservé admin/organisateur");
        return;
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

      const sessionUserID = getUserID(req);
      if (sessionUserID === null) {
        unauthorized(res);
        return;
      }

      const isAdmin = req.user?.role?.roleLabel === "admin";
      const isOwner = sessionUserID === targetUserID;

      if (!isAdmin && !isOwner) {
        forbidden(res, "Admin or owner only");
        return;
      }

      next();
    });
  };
};
