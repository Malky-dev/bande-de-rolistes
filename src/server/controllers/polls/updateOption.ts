import type { Request, Response } from "express";

import { PollOption } from "../../models";
import type { UpdatePollOptionBody } from "../../../types/api/polls";
import {
  badRequest,
  canManagePoll,
  forbid,
  notFound,
  normalizeString,
  parseIntParam,
} from "./helpers";

type UpdateOptionParams = {
  pollID: string;
  optionID: string;
};

type UpdateOptionResponse = {
  message: string;
};

export default async function updateOption(
  req: Request<UpdateOptionParams, UpdateOptionResponse, UpdatePollOptionBody>,
  res: Response<UpdateOptionResponse>,
) {
  if (!canManagePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour modifier une option.");
  }

  const pollID = parseIntParam(req.params.pollID);
  const optionID = parseIntParam(req.params.optionID);

  if (!pollID) {
    return badRequest(res, "Identifiant de sondage invalide.");
  }

  if (!optionID) {
    return badRequest(res, "Identifiant d'option invalide.");
  }

  const updates: Partial<{
    label: string;
    displayOrder: number;
  }> = {};

  if (req.body.label !== undefined) {
    const label = normalizeString(req.body.label);

    if (!label) {
      return badRequest(res, "Le libellé de l'option ne peut pas être vide.");
    }

    updates.label = label;
  }

  if (req.body.displayOrder !== undefined) {
    const { displayOrder } = req.body;

    if (!Number.isInteger(displayOrder) || displayOrder < 0) {
      return badRequest(
        res,
        "L'ordre d'affichage doit être un entier supérieur ou égal à 0.",
      );
    }

    updates.displayOrder = displayOrder;
  }

  if (Object.keys(updates).length === 0) {
    return badRequest(res, "Aucune modification valide n'a été fournie.");
  }

  try {
    const option = await PollOption.findOne({
      where: {
        optionID,
        pollID,
      },
    });

    if (!option) {
      return notFound(res, "Option introuvable.");
    }

    await option.update(updates);

    return res.status(200).json({
      message: "Option mise à jour avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'option :", error);
    return res.status(500).json({
      message: "Impossible de mettre à jour l'option.",
    });
  }
}
