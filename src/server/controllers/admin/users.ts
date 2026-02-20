import type { Request, Response } from 'express'
import { User, Role, type UserWithRole } from '../../models'

/**
 * Liste tous les utilisateurs avec leurs rôles
 */
export default async function controllerAdminUsers(req: Request, res: Response): Promise<void> {
  try {
    const users: UserWithRole[] = await User.findAll({
      include: {
        model: Role,
        required: true,
      },
      order: [['nickname', 'ASC']],
    })

    const usersList = users.map(user => ({
      userID: user.userID,
      nickname: user.nickname,
      email: user.email,
      roleID: user.roleID,
      roleLabel: user.role?.roleLabel || 'member',
      isVerified: user.isVerified,
    }))
    

    res.json(usersList)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ code: 'ERROR', message })
  }
}
