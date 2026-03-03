import { Router } from "express";

import adminUsersController from "../controllers/admin/users";
import adminRolesController from "../controllers/admin/roles";
import adminUpdateRoleController from "../controllers/admin/updateRole";

import { requireAdmin, verifyCsrf, requestLimiter } from "../middleware";

const router = Router();

type UpdateRoleParams = {
  userID: string;
};

router.get(
  "/admin/users",
  requestLimiter,
  requireAdmin(),
  adminUsersController,
);
router.get(
  "/admin/roles",
  requestLimiter,
  requireAdmin(),
  adminRolesController,
);

router.put<UpdateRoleParams>(
  "/admin/users/:userID/role",
  requestLimiter,
  verifyCsrf(),
  requireAdmin(),
  adminUpdateRoleController,
);

export default router;
