import type { RequestHandler } from "express";
import { TableRPG } from "../../models";
import type { ApiError } from "../../../types/api/errors";
import {
  badRequest,
  forbid,
  getUserID,
  hasRole,
  notFound,
  parseIntParam,
} from "./helpers";

type Params = { eventID: string };
type Body = { status: "OPEN" | "CLOSED" | "CANCELLED" };

type Response = { message: string } | ApiError;

const ADMIN_OR_ORGA = [1, 2];

const controllerUpdateStatus: RequestHandler<Params, Response, Body> = async (
  req,
  res,
): Promise<void> => {
  try {
    const eventID = parseIntParam(req.params.eventID);
    if (eventID === null) {
      badRequest(res, "eventID invalide");
      return;
    }

    const userID = getUserID(req);
    const roleID = req.user?.role?.roleID;
    if (!userID || typeof roleID !== "number") {
      res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Not authenticated" });
      return;
    }

    const { status } = req.body;
    if (status !== "OPEN" && status !== "CLOSED" && status !== "CANCELLED") {
      badRequest(res, "status invalide");
      return;
    }

    const table = await TableRPG.findByPk(eventID);
    if (!table) {
      notFound(res, "Table introuvable");
      return;
    }

    const isAdminOrOrga = hasRole(req, ADMIN_OR_ORGA);
    // Le propriétaire de la table est le MJ (dungeon_master)
    const isOwnerDM = table.dungeon_master === userID;

    if (!isAdminOrOrga && !isOwnerDM) {
      forbid(res, "Accès refusé");
      return;
    }

    table.status = status;
    await table.save();

    res.json({ message: "Statut mis à jour" });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    res.status(500).json({ code: "ERROR", message });
  }
};

export default controllerUpdateStatus;
