import type { Request, Response } from "express";

import { Poll, PollOption } from "../../models";
import type { CreatePollBody } from "../../../types/api/polls";
import {
  badRequest,
  canManagePoll,
  forbid,
  getUserID,
  normalizeOptionLabels,
  normalizeOptionalString,
  normalizeString,
  unauthorized,
} from "./helpers";

type CreatePollResponse =
  | {
      pollID: number;
      message: string;
    }
  | {
      code: string;
      message: string;
    };

export default async function createPoll(
  req: Request<Record<string, never>, CreatePollResponse, CreatePollBody>,
  res: Response<CreatePollResponse>,
) {
  if (!canManagePoll(req)) {
    return forbid(res, "Vous n'avez pas les droits pour créer un sondage.");
  }

  const userID = getUserID(req);

  if (typeof userID !== "number") {
    return unauthorized(res, "Authentification requise.");
  }

  const title = normalizeString(req.body.title);
  const description = normalizeOptionalString(req.body.description);
  const endAt = new Date(req.body.endAt);
  const options = normalizeOptionLabels(req.body.options);
  const maxSelections = 1;

  if (!title) {
    return badRequest(res, "Le titre du sondage est obligatoire.");
  }

  if (Number.isNaN(endAt.getTime())) {
    return badRequest(res, "La date de fin est invalide.");
  }

  if (endAt.getTime() <= Date.now()) {
    return badRequest(res, "La date de fin doit être dans le futur.");
  }

  if (options.length < 2) {
    return badRequest(res, "Un sondage doit contenir au moins deux options.");
  }

  try {
    const createdPoll = await Poll.sequelize!.transaction(
      async (transaction) => {
        const poll = await Poll.create(
          {
            title,
            description,
            createdBy: userID,
            maxSelections,
            endAt,
          },
          { transaction },
        );

        await PollOption.bulkCreate(
          options.map((label, index) => ({
            pollID: poll.pollID,
            label,
            displayOrder: index,
          })),
          { transaction },
        );

        return poll;
      },
    );

    return res.status(201).json({
      pollID: createdPoll.pollID,
      message: "Sondage créé avec succès.",
    });
  } catch (error) {
    console.error("Erreur lors de la création du sondage :", error);
    return res.status(500).json({
      code: "INTERNAL_SERVER_ERROR",
      message: "Impossible de créer le sondage.",
    });
  }
}
