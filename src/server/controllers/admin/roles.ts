import type { Request, Response } from 'express'
import { Role } from '../../models'

/**
 * Liste tous les rôles disponibles
 */
export default async function controllerAdminRoles(req: Request, res: Response): Promise<void> {
  try {
    const roles = await Role.findAll({
      order: [['roleID', 'ASC']],
    })

    res.json(
      roles.map(role => ({
        roleID: role.roleID,
        roleLabel: role.roleLabel,
      }))
    )
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ code: 'ERROR', message })
  }
}
