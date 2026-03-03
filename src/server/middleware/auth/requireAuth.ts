import type { RequestHandler } from "express";
import { Op } from "sequelize";
import { Role, Session, User } from "../../models";
import { extractAuthToken } from "./token";

const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const token = extractAuthToken(req);

    if (!token) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Token required" });
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
          attributes: ["userID", "nickname"],
          include: [
            {
              model: Role,
              as: "role",
              required: true,
              attributes: ["roleID", "roleLabel"],
            },
          ],
        },
      ],
    });

    if (!session?.user) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid token" });
      return;
    }

    const dbUser = session.user;

    const role = dbUser.role
      ? { roleID: dbUser.role.roleID, roleLabel: dbUser.role.roleLabel }
      : null;

    if (!role) {
      res.status(500).json({ code: "ERROR", message: "User role missing" });
      return;
    }

    const userLike: NonNullable<typeof req.user> = {
      userID: dbUser.userID,
      nickname: dbUser.nickname,
      role,
    };

    const sessionLike: NonNullable<typeof req.session> = {
      sessionID: session.sessionID,
      token: session.token,
      expiration: session.expiration,
      user: userLike,
    };

    req.user = userLike;
    req.session = sessionLike;

    next();
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    res.status(500).json({ code: "ERROR", message });
  }
};

export default requireAuth;
