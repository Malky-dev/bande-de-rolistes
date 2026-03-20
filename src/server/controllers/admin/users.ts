import type { RequestHandler } from "express";
import { User, Role, type UserWithRole } from "../../models";
import type { ApiError } from "../../../types/api/errors";

type AdminUserItem = {
  userID: number;
  nickname: string;
  email: string;
  roleID: number;
  roleLabel: string;
  isVerified: boolean;
};

/**
 * Liste tous les utilisateurs avec leurs rôles
 */
const controllerAdminUsers: RequestHandler<
  Record<string, never>,
  AdminUserItem[] | ApiError,
  Record<string, never>
> = async (_req, res): Promise<void> => {
  try {
    const users: UserWithRole[] = await User.findAll({
      include: { model: Role, as: "role", required: true },
      order: [["nickname", "ASC"]],
    });

    const usersList: AdminUserItem[] = users.map((user) => ({
      userID: user.userID,
      nickname: user.nickname,
      email: user.email,
      roleID: user.roleID,
      roleLabel: user.role?.roleLabel ?? "member",
      isVerified: user.isVerified,
    }));

    res.json(usersList);
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const payload: ApiError = { code: "ERROR", message };
    res.status(500).json(payload);
  }
};

export default controllerAdminUsers;
