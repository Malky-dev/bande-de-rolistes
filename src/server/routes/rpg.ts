import { Router } from "express";

import { requireAuth, verifyCsrf, requestLimiter } from "../middleware";

import controllerListTables from "../controllers/rpg/listTables";
import controllerGetTable from "../controllers/rpg/getTable";
import controllerCreateTable from "../controllers/rpg/createTable";
import controllerUpdateTable from "../controllers/rpg/updateTable";
import controllerUpdateStatus from "../controllers/rpg/updateStatus";
import controllerSignup from "../controllers/rpg/signup";
import controllerUnsignup from "../controllers/rpg/unsignup";

type TableParams = { eventID: string };

const router = Router();

router.get("/rpg/tables", requestLimiter, controllerListTables);
router.get<TableParams>(
  "/rpg/tables/:eventID",
  requestLimiter,
  controllerGetTable,
);

router.post(
  "/rpg/tables",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  controllerCreateTable,
);
router.put<TableParams>(
  "/rpg/tables/:eventID",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  controllerUpdateTable,
);
router.put<TableParams>(
  "/rpg/tables/:eventID/status",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  controllerUpdateStatus,
);

router.post<TableParams>(
  "/rpg/tables/:eventID/signup",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  controllerSignup,
);
router.delete<TableParams>(
  "/rpg/tables/:eventID/signup",
  requestLimiter,
  verifyCsrf(),
  requireAuth,
  controllerUnsignup,
);

export default router;
