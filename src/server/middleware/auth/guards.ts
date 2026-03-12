import type { Request, RequestHandler, Response } from "express";
import requireAuth from "./requireAuth";
import {
  RPG_ALLOWED_CREATE_ROLE_IDS,
  RPG_ADMIN_OR_ORGA_ROLE_IDS,
} from "../../../shared/constants";

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
  const roleIDUnknown: unknown = req.user?.role?.roleID;
  if (typeof roleIDUnknown !== "number") {
    return null;
  }

  return roleIDUnknown;
}

function getUserID(req: Request): number | null {
  const userIDUnknown: unknown = req.user?.userID;
  if (typeof userIDUnknown !== "number") {
    return null;
  }

  return userIDUnknown;
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

export const requireCreateRpgTable = (): RequestHandler => {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      if (!hasAllowedRole(req, RPG_ALLOWED_CREATE_ROLE_IDS)) {
        forbidden(res, "Accès réservé aux rôles 1, 2 ou 3");
        return;
      }

      next();
    });
  };
};

export const requireAdminOrOrga = (): RequestHandler => {
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

export const requireAdminOrOrgaOrOwnerRpgTable = (
  getOwnerUserID: (req: Request) => number | null,
): RequestHandler => {
  return (req, res, next) => {
    requireAuth(req, res, () => {
      const sessionUserID = getUserID(req);
      if (sessionUserID === null) {
        unauthorized(res);
        return;
      }

      if (hasAllowedRole(req, RPG_ADMIN_OR_ORGA_ROLE_IDS)) {
        next();
        return;
      }

      const roleID = getRoleID(req);
      if (roleID !== 3) {
        forbidden(res, "Accès refusé");
        return;
      }

      const ownerUserID = getOwnerUserID(req);
      if (ownerUserID === null) {
        forbidden(res, "Accès refusé");
        return;
      }

      if (sessionUserID !== ownerUserID) {
        forbidden(res, "Accès refusé");
        return;
      }

      next();
    });
  };
};

export { getRoleID, getUserID, hasAllowedRole };
