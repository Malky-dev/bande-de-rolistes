import type { RequestHandler } from "express";
import { Op } from "sequelize";
import { Session, User, Role } from "../models";
import { getCookieValue } from "../utils/cookies";
import type { ApiError } from "../../types/api/errors";
import type { SessionInfo } from "../../types/api/session";

type SessionResponse = SessionInfo | ApiError;

const controllerSession: RequestHandler<
  Record<string, never>,
  SessionResponse,
  Record<string, never>
> = async (req, res): Promise<void> => {
  try {
    const cookieHeader = req.get("Cookie") ?? undefined;
    const token =
      typeof cookieHeader === "string"
        ? getCookieValue(cookieHeader, "bande_de_rolistes")
        : undefined;

    if (!token) {
      res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Session non trouvée" });
      return;
    }

    const session = await Session.findOne({
      where: {
        token,
        expiration: { [Op.gt]: new Date() },
      },
      include: [
        {
          model: User,
          as: "user",
          required: true,
          attributes: ["userID", "nickname", "isVerified"],
          include: [
            {
              model: Role,
              as: "role",
              required: false,
              attributes: ["roleID", "roleLabel"],
            },
          ],
        },
      ],
    });

    if (!session || !session.user) {
      res
        .status(401)
        .json({ code: "UNAUTHORIZED", message: "Session expirée ou invalide" });
      return;
    }

    const { user } = session;

    const roleLabel = user.role?.roleLabel ?? "member";
    const roleID = user.role?.roleID ?? 5;

    const payload: SessionInfo = {
      userID: user.userID,
      nickname: user.nickname,
      roleID,
      role: roleLabel,
      isVerified: Boolean(user.isVerified),
    };

    res.json(payload);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const payload: ApiError = { code: "ERROR", message };
    res.status(500).json(payload);
  }
};

export default controllerSession;
