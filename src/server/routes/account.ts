import { Router } from "express";

import controllerGetAccount from "../controllers/account/getAccount";
import controllerUpdateAccount from "../controllers/account/updateAccount";
import { requireAuth, verifyCsrf, requestLimiter } from "../middleware";

const router = Router();

router.get("/account", requestLimiter, requireAuth, controllerGetAccount);
router.put(
  "/account",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  controllerUpdateAccount,
);

export default router;
