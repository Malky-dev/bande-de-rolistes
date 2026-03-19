import type { Request, Response } from "express";

import { Poll, PollOption, PollVote } from "../../models";
import type { ReplacePollVoteBody } from "../../../types/api/polls";
import {
  badRequest,
  canVotePoll,
  forbid,
  getUserID,
  isPollClosed,
  notFound,
  parseIntParam,
  unauthorized,
  uniqueNumbers,
} from "./helpers";

type ReplaceVoteParams = {
  pollID: string;
};

type ReplaceVoteResponse =
  | {
      message: string;
    }
  | {
      code: string;
      message: string;
    };

export default async function replaceVote(
  req: Request<ReplaceVoteParams, ReplaceVoteResponse, ReplacePollVoteBody>,
  res: Response<ReplaceVoteResponse>,
) {
  if (!canVotePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour voter.");
  }

  const userID = getUserID(req);

  if (typeof userID !== "number") {
    return unauthorized(res, "Authentification requise.");
  }

  const pollID = parseIntParam(req.params.pollID);

  if (!pollID) {
    return badRequest(res, "Identifiant de sondage invalide.");
  }

  const optionIDs = uniqueNumbers(req.body.optionIDs);

  if (optionIDs.length === 0) {
    return badRequest(res, "Vous devez sélectionner au moins une option.");
  }

  try {
    const poll = await Poll.findByPk(pollID);

    if (!poll) {
      return notFound(res, "Sondage non trouvé.");
    }

    if (isPollClosed(poll)) {
      return badRequest(res, "Ce sondage est fermé.");
    }

    if (optionIDs.length > poll.maxSelections) {
      return badRequest(
        res,
        `Vous ne pouvez pas sélectionner plus de ${poll.maxSelections} option(s).`,
      );
    }

    const options = await PollOption.findAll({
      where: { pollID },
      attributes: ["optionID"],
    });

    const allowedOptionIDs = new Set(options.map((option) => option.optionID));
    const allOptionsBelongToPoll = optionIDs.every((optionID) =>
      allowedOptionIDs.has(optionID),
    );

    if (!allOptionsBelongToPoll) {
      return badRequest(
        res,
        "Au moins une option sélectionnée n'appartient pas à ce sondage.",
      );
    }

    await PollVote.sequelize!.transaction(async (transaction) => {
      await PollVote.destroy({
        where: {
          pollID,
          userID,
        },
        transaction,
      });

      await PollVote.bulkCreate(
        optionIDs.map((optionID) => ({
          pollID,
          optionID,
          userID,
        })),
        { transaction },
      );
    });

    return res.status(200).json({
      message: "Vote enregistré avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de l'enregistrement du vote :", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible d'enregistrer le vote.",
    });
  }
}
