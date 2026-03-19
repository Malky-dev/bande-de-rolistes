import type { Request, Response } from "express";

import { Poll } from "../../models";
import {
  badRequest,
  canManagePoll,
  forbid,
  notFound,
  parseIntParam,
} from "./helpers";

type DeletePollParams = {
  pollID: string;
};

type DeletePollResponse = {
  message: string;
};

export default async function deletePoll(
  req: Request<DeletePollParams, DeletePollResponse>,
  res: Response<DeletePollResponse>,
) {
  if (!canManagePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour supprimer un sondage.");
  }

  const pollID = parseIntParam(req.params.pollID);

  if (!pollID) {
    return badRequest(res, "Identifiant de sondage invalide.");
  }

  try {
    const poll = await Poll.findByPk(pollID);

    if (!poll) {
      return notFound(res, "Sondage non trouvé.");
    }

    await poll.destroy();

    return res.status(200).json({
      message: "Sondage supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du sondage :", error);
    return res.status(500).json({
      message: "Impossible de supprimer le sondage.",
    });
  }
}
