import type { RequestHandler } from "express";
import { User } from "../../models";
import type { ApiError } from "../../../types/api/errors";

type AccountMe = {
  userID: number;
  nickname: string;
  email: string;
  discordId: string | null;
};

type AccountResponse = AccountMe | ApiError;

const controllerGetAccount: RequestHandler<
  Record<string, never>,
  AccountResponse,
  Record<string, never>
> = async (req, res): Promise<void> => {
  try {
    if (!req.user?.userID) {
      res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Not authenticated" });
      return;
    }

    const user = await User.findByPk(req.user.userID);

    if (!user) {
      res
        .status(404)
        .json({ code: "NOT_FOUND", message: "Utilisateur introuvable" });
      return;
    }

    const payload: AccountMe = {
      userID: user.userID,
      nickname: user.nickname,
      email: user.email,
      discordId: user.discordId,
    };

    res.json(payload);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const payload: ApiError = { code: "ERROR", message };
    res.status(500).json(payload);
  }
};

export default controllerGetAccount;
