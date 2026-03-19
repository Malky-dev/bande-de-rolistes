import type { Request, Response } from "express";
import { Poll } from "../../models";
import type { UpdatePollBody } from "../../../types/api/polls";
import {
  badRequest,
  canManagePoll,
  forbid,
  notFound,
  normalizeOptionalString,
  normalizeString,
  parseIntParam,
} from "./helpers";

type UpdatePollParams = {
  pollID: string;
};

type UpdatePollResponse =
  | { message: string }
  | { code: string; message: string };

type PollUpdates = Partial<{
  title: string;
  description: string | null;
  endAt: Date;
}>;

export default async function updatePoll(
  req: Request<UpdatePollParams, UpdatePollResponse, UpdatePollBody>,
  res: Response<UpdatePollResponse>,
) {
  if (!canManagePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour modifier un sondage.");
  }

  const pollID = parseIntParam(req.params.pollID);
  if (!pollID) {
    return badRequest(res, "Identifiant de sondage invalide.");
  }

  const updates: PollUpdates = {};

  if (req.body.title !== undefined) {
    const title = normalizeString(req.body.title);
    if (!title) {
      return badRequest(res, "Le titre du sondage ne peut pas être vide.");
    }
    updates.title = title;
  }

  if (req.body.description !== undefined) {
    updates.description = normalizeOptionalString(req.body.description);
  }

  if (req.body.endAt !== undefined) {
    const endAt = new Date(req.body.endAt);
    if (Number.isNaN(endAt.getTime())) {
      return badRequest(res, "La date de fin est invalide.");
    }
    if (endAt.getTime() <= Date.now()) {
      return badRequest(res, "La date de fin doit être dans le futur.");
    }
    updates.endAt = endAt;
  }

  if (req.body.maxSelections !== undefined && req.body.maxSelections !== 1) {
    return badRequest(
      res,
      "Pour le moment, un sondage ne peut autoriser qu'une seule sélection.",
    );
  }

  try {
    const poll = await Poll.findByPk(pollID);
    if (!poll) {
      return notFound(res, "Sondage non trouvé.");
    }

    if (Object.keys(updates).length === 0) {
      return badRequest(res, "Aucune modification valide n'a été fournie.");
    }

    await poll.update(updates);

    return res.status(200).json({
      message: "Sondage mis à jour avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du sondage :", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de mettre à jour le sondage.",
    });
  }
}
