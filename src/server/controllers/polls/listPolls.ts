import type { Request, Response } from "express";
import { col, fn, Op } from "sequelize";

import { Poll, PollVote, User } from "../../models";
import type { PollListItem } from "../../../types/api/polls";
import { canManagePoll, isPollClosed } from "./helpers";

type PollAuthor = {
  userID: number;
  nickname: string;
};

type PollWithAuthorAndStats = Poll & {
  author?: PollAuthor;
  dataValues: Poll["dataValues"] & {
    totalVoters?: number | string | null;
    totalVotes?: number | string | null;
  };
};

export default async function listPolls(
  req: Request,
  res: Response<PollListItem[] | { message: string }>,
) {
  try {
    const polls = (await Poll.findAll({
      where: {
        isClosedManually: false,
        endAt: {
          [Op.gt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: "author",
          attributes: ["userID", "nickname"],
          required: true,
        },
        {
          model: PollVote,
          as: "votes",
          attributes: [],
          required: false,
        },
      ],
      attributes: [
        "pollID",
        "title",
        "description",
        "endAt",
        "createdAt",
        "createdBy",
        "maxSelections",
        "isClosedManually",
        [fn("COUNT", col("votes.vote_id")), "totalVotes"],
        [fn("COUNT", fn("DISTINCT", col("votes.user_id"))), "totalVoters"],
      ],
      group: ["Poll.poll_id", "author.userID", "author.nickname"],
      order: [
        ["endAt", "ASC"],
        ["createdAt", "DESC"],
      ],
      subQuery: false,
    })) as PollWithAuthorAndStats[];

    const payload: PollListItem[] = polls.map((poll) => ({
      pollID: poll.pollID,
      title: poll.title,
      description: poll.description,
      endAt: poll.endAt.toISOString(),
      createdAt: poll.createdAt.toISOString(),
      createdBy: {
        userID: poll.author?.userID ?? poll.createdBy,
        nickname: poll.author?.nickname ?? "Utilisateur inconnu",
      },
      maxSelections: poll.maxSelections,
      totalVoters: Number(poll.dataValues.totalVoters ?? 0),
      totalVotes: Number(poll.dataValues.totalVotes ?? 0),
      isClosed: isPollClosed(poll),
      canManage: canManagePoll(req),
    }));

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Erreur lors de la récupération des sondages :", error);
    return res.status(500).json({
      message: "Impossible de récupérer les sondages.",
    });
  }
}
