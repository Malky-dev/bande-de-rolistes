import type { Request, Response } from "express";

import { Poll, PollVote } from "../../models";
import {
  badRequest,
  canVotePoll,
  forbid,
  getUserID,
  isPollClosed,
  notFound,
  parseIntParam,
  unauthorized,
} from "./helpers";

type DeleteVoteParams = {
  pollID: string;
};

type DeleteVoteResponse =
  | {
      message: string;
    }
  | {
      code: string;
      message: string;
    };

export default async function deleteVote(
  req: Request<DeleteVoteParams, DeleteVoteResponse>,
  res: Response<DeleteVoteResponse>,
) {
  if (!canVotePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour supprimer votre vote.");
  }

  const userID = getUserID(req);

  if (typeof userID !== "number") {
    return unauthorized(res, "Authentification requise.");
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

    if (isPollClosed(poll)) {
      return badRequest(res, "Ce sondage est fermé.");
    }

    await PollVote.destroy({
      where: {
        pollID,
        userID,
      },
    });

    return res.status(200).json({
      message: "Vote supprimé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du vote :", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de supprimer le vote.",
    });
  }
}
