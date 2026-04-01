// ---------------------------
// auth.ts - Routes Auth
// ---------------------------

import { Router } from "express";
import type { LoginBody } from "../../types/api/auth";

import signinController from "../controllers/signin";
import loginController from "../controllers/login";
import { verifyCsrf } from "../middleware/csrf";
import { requestLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/auth/signin", requestLimiter, verifyCsrf(), signinController);

router.post(
  "/auth/login",
  requestLimiter,
  verifyCsrf<Record<string, string>, LoginBody>(),
  loginController,
);

export default router;
