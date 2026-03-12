import type { RequestHandler } from "express";
import { Role, TableRPG, User } from "../../models";
import type { ApiError } from "../../../types/api/errors";
import { badRequest, forbid, getUserID, hasRole } from "./helpers";

type CreateBody = {
  eventDate: string;
  dungeonMasterUserID?: number;
  location: string;
  game: string;
  comments?: string | null;
  maxPlayers?: number;
};

type CreateResponse = { eventID: number; message: string } | ApiError;

const ALLOWED_CREATE = [1, 2, 3];
const ALLOWED_DM = [1, 2, 3];

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getRoleIDFromUserJson = (userJson: unknown): number | null => {
  if (!isRecord(userJson)) {
    return null;
  }

  const roleUnknown = userJson["role"];
  if (!isRecord(roleUnknown)) {
    return null;
  }

  const roleIDUnknown = roleUnknown["roleID"];
  if (typeof roleIDUnknown !== "number") {
    return null;
  }

  return roleIDUnknown;
};

const controllerCreateTable: RequestHandler<
  Record<string, never>,
  CreateResponse,
  CreateBody
> = async (req, res): Promise<void> => {
  try {
    if (!hasRole(req, ALLOWED_CREATE)) {
      forbid(res, "Accès refusé");
      return;
    }

    const userID = getUserID(req);
    if (!userID) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
      return;
    }

    const {
      eventDate,
      dungeonMasterUserID,
      location,
      game,
      comments,
      maxPlayers,
    } = req.body;

    if (typeof eventDate !== "string") {
      badRequest(res, "eventDate requis (ISO string)");
      return;
    }

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      badRequest(res, "eventDate invalide");
      return;
    }

    if (typeof location !== "string" || location.trim().length < 2) {
      badRequest(res, "location invalide");
      return;
    }

    if (typeof game !== "string" || game.trim().length < 2) {
      badRequest(res, "game invalide");
      return;
    }

    const roleIDUnknown: unknown = req.user?.role?.roleID;
    if (typeof roleIDUnknown !== "number") {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Not authenticated",
      });
      return;
    }

    const roleID = roleIDUnknown;

    let dmUserID: number;

    // Les rôles 1, 2 et 3 peuvent créer une table pour eux-mêmes.
    if (ALLOWED_CREATE.includes(roleID)) {
      dmUserID = userID;
    } else {
      if (typeof dungeonMasterUserID !== "number") {
        badRequest(res, "dungeonMasterUserID requis");
        return;
      }
      dmUserID = dungeonMasterUserID;
    }

    const dm = await User.findByPk(dmUserID, {
      include: [{ model: Role, as: "role", required: true }],
    });

    if (!dm) {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Le MJ doit avoir un rôle 1, 2 ou 3",
      });
      return;
    }

    const dmJsonUnknown: unknown = dm.toJSON();
    const dmRoleID = getRoleIDFromUserJson(dmJsonUnknown);

    if (dmRoleID === null || !ALLOWED_DM.includes(dmRoleID)) {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Le MJ doit avoir un rôle 1, 2 ou 3",
      });
      return;
    }

    const mp =
      typeof maxPlayers === "number" && Number.isFinite(maxPlayers)
        ? Math.floor(maxPlayers)
        : 10;

    if (mp < 1 || mp > 10) {
      badRequest(res, "maxPlayers doit être entre 1 et 10");
      return;
    }

    const created = await TableRPG.create({
      eventDate: parsedDate,
      dungeon_master: dmUserID,
      location: location.trim(),
      game: game.trim(),
      comments: typeof comments === "string" ? comments : (comments ?? null),
      status: "OPEN",
      maxPlayers: mp,
    });

    res.status(201).json({
      eventID: created.eventID,
      message: "Table créée",
    });
  } catch (error) {
    console.error(error);
    const err = error instanceof Error ? error : new Error("Erreur serveur");
    res.status(500).json({ code: "ERROR", message: err.message });
  }
};

export default controllerCreateTable;
