import type { Request, Response } from "express";

import { Poll, PollOption } from "../../models";
import type { CreatePollOptionBody } from "../../../types/api/polls";
import {
  badRequest,
  canManagePoll,
  forbid,
  notFound,
  normalizeString,
  parseIntParam,
} from "./helpers";

type CreateOptionParams = {
  pollID: string;
};

type CreateOptionResponse =
  | {
      optionID: number;
      message: string;
    }
  | {
      message: string;
    };

export default async function createOption(
  req: Request<CreateOptionParams, CreateOptionResponse, CreatePollOptionBody>,
  res: Response<CreateOptionResponse>,
) {
  if (!canManagePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour ajouter une option.");
  }

  const pollID = parseIntParam(req.params.pollID);

  if (!pollID) {
    return badRequest(res, "Identifiant de sondage invalide.");
  }

  const label = normalizeString(req.body.label);

  if (!label) {
    return badRequest(res, "Le libellé de l'option est obligatoire.");
  }

  try {
    const poll = await Poll.findByPk(pollID);

    if (!poll) {
      return notFound(res, "Sondage non trouvé.");
    }

    const lastOption = await PollOption.findOne({
      where: { pollID },
      order: [["displayOrder", "DESC"]],
    });

    const displayOrder = lastOption ? lastOption.displayOrder + 1 : 0;

    const option = await PollOption.create({
      pollID,
      label,
      displayOrder,
    });

    return res.status(201).json({
      optionID: option.optionID,
      message: "Option ajoutée avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout d'une option :", error);
    return res.status(500).json({
      message: "Impossible d'ajouter l'option.",
    });
  }
}
