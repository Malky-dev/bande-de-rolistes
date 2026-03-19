import type { Request } from "express";
import { Op } from "sequelize";
import { Role, Session, User } from "../../models";
import { extractAuthToken } from "./token";

export async function attachAuthContext(req: Request): Promise<boolean> {
  const token = extractAuthToken(req);

  if (!token) {
    return false;
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
    return false;
  }

  const dbUser = session.user;

  const role = dbUser.role
    ? { roleID: dbUser.role.roleID, roleLabel: dbUser.role.roleLabel }
    : null;

  if (!role) {
    return false;
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

  return true;
}
