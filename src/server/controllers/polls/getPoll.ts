import type { Request, Response } from "express";

import { Poll, PollOption, PollVote, User } from "../../models";
import type { PollDetails, PollOptionView } from "../../../types/api/polls";
import {
  badRequest,
  canManagePoll,
  canVotePoll,
  getUserID,
  isPollClosed,
  notFound,
  parseIntParam,
} from "./helpers";

type GetPollParams = {
  pollID: string;
};

type GetPollResponse =
  | PollDetails
  | { message: string }
  | { code: string; message: string };

type UserPreview = {
  userID: number;
  nickname: string;
};

type PollVoteWithUser = PollVote & {
  user?: UserPreview;
};

type PollOptionWithVotes = PollOption & {
  votes?: PollVoteWithUser[];
};

type PollWithDetails = Poll & {
  author?: UserPreview;
  options?: PollOptionWithVotes[];
};

export default async function getPoll(
  req: Request<GetPollParams, GetPollResponse>,
  res: Response<GetPollResponse>,
) {
  const pollID = parseIntParam(req.params.pollID);

  if (!pollID) {
    return badRequest(res, "Identifiant de sondage invalide.");
  }

  try {
    const poll = (await Poll.findByPk(pollID, {
      include: [
        {
          model: User,
          as: "author",
          attributes: ["userID", "nickname"],
          required: true,
        },
        {
          model: PollOption,
          as: "options",
          attributes: [
            "optionID",
            "label",
            "displayOrder",
            "createdAt",
            "updatedAt",
          ],
          required: false,
          include: [
            {
              model: PollVote,
              as: "votes",
              attributes: [
                "voteID",
                "pollID",
                "optionID",
                "userID",
                "createdAt",
                "updatedAt",
              ],
              required: false,
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["userID", "nickname"],
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      order: [[{ model: PollOption, as: "options" }, "displayOrder", "ASC"]],
    })) as PollWithDetails | null;

    if (!poll) {
      return notFound(res, "Sondage non trouvé.");
    }

    const currentUserID = getUserID(req);
    const closed = isPollClosed(poll);

    const options: PollOptionView[] = (poll.options ?? []).map((option) => {
      const votes = option.votes ?? [];

      return {
        optionID: option.optionID,
        label: option.label,
        displayOrder: option.displayOrder,
        voteCount: votes.length,
        voters: votes.map((vote) => ({
          userID: vote.userID,
          nickname: vote.user?.nickname ?? "Utilisateur inconnu",
        })),
      };
    });

    const myVote =
      typeof currentUserID !== "number"
        ? []
        : options
            .filter((option) =>
              option.voters.some((voter) => voter.userID === currentUserID),
            )
            .map((option) => option.optionID);

    const payload: PollDetails = {
      pollID: poll.pollID,
      title: poll.title,
      description: poll.description,
      endAt: poll.endAt.toISOString(),
      createdAt: poll.createdAt.toISOString(),
      updatedAt: poll.updatedAt.toISOString(),
      createdBy: {
        userID: poll.author?.userID ?? poll.createdBy,
        nickname: poll.author?.nickname ?? "Utilisateur inconnu",
      },
      maxSelections: poll.maxSelections,
      isClosed: closed,
      canVote: !closed && typeof currentUserID === "number" && canVotePoll(req),
      canManage: canManagePoll(req),
      myVote,
      options,
    };

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Erreur lors de la récupération du sondage :", error);
    return res.status(500).json({
      message: "Impossible de récupérer le sondage.",
    });
  }
}
