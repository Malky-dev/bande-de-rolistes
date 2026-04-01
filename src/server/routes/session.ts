// ---------------------------
// session.ts - Route Session utilisateur
// ---------------------------

import { Router } from "express";

import sessionController from "../controllers/session";
import { requestLimiter } from "../middleware/rateLimit";

const router = Router();

// ---------------------------
// Session
// ---------------------------

router.get("/session", requestLimiter, sessionController);

export default router;
