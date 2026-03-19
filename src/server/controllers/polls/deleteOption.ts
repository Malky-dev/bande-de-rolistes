import type { Request, Response } from "express";
import { PollOption } from "../../models";
import {
  badRequest,
  canManagePoll,
  forbid,
  notFound,
  parseIntParam,
} from "./helpers";

type DeleteOptionParams = {
  pollID: string;
  optionID: string;
};

type DeleteOptionResponse =
  | { message: string }
  | { code: string; message: string };

export default async function deleteOption(
  req: Request<DeleteOptionParams, DeleteOptionResponse>,
  res: Response<DeleteOptionResponse>,
) {
  if (!canManagePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour supprimer une option.");
  }

  const pollID = parseIntParam(req.params.pollID);
  const optionID = parseIntParam(req.params.optionID);

  if (!pollID) {
    return badRequest(res, "Identifiant de sondage invalide.");
  }

  if (!optionID) {
    return badRequest(res, "Identifiant d'option invalide.");
  }

  try {
    const option = await PollOption.findOne({
      where: { optionID, pollID },
    });

    if (!option) {
      return notFound(res, "Option introuvable.");
    }

    const optionCount = await PollOption.count({
      where: { pollID },
    });

    if (optionCount <= 2) {
      return badRequest(
        res,
        "Un sondage doit conserver au moins deux options.",
      );
    }

    await option.destroy();

    return res.status(200).json({
      message: "Option supprimée avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'option :", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de supprimer l'option.",
    });
  }
}
