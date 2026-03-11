import { Router } from "express";
import {
  requireAdmin,
  requireAdminOrOwner,
  verifyCsrf,
  requestLimiter,
} from "../middleware";
import {
  createCotisation,
  getCotisationStatus,
  listCotisations,
} from "../controllers/cotisation";

const router = Router();

router.get(
  "/users/:userID/cotisations",
  requestLimiter,
  requireAdminOrOwner("userID"),
  listCotisations,
);

router.get(
  "/users/:userID/cotisations/status",
  requestLimiter,
  requireAdminOrOwner("userID"),
  getCotisationStatus,
);

router.post(
  "/users/:userID/cotisations",
  requestLimiter,
  verifyCsrf(),
  requireAdmin(),
  createCotisation,
);

export default router;
