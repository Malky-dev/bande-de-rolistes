import type { RequestHandler } from 'express'
import { Role } from '../../models'
import type { ApiError } from '../../../types/api/errors'

type AdminRoleItem = {
  roleID: number
  roleLabel: string
}

/**
 * Liste tous les rôles disponibles
 */
const controllerAdminRoles: RequestHandler<
  Record<string, never>,
  AdminRoleItem[] | ApiError,
  Record<string, never>
> = async (req, res): Promise<void> => {
  try {
    const roles = await Role.findAll({
      order: [['roleID', 'ASC']],
    })

    const payload: AdminRoleItem[] = roles.map((role) => ({
      roleID: role.roleID,
      roleLabel: role.roleLabel,
    }))

    res.json(payload)
  } catch (error) {
    console.error(error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const payload: ApiError = { code: 'ERROR', message }
    res.status(500).json(payload)
  }
}

export default controllerAdminRoles