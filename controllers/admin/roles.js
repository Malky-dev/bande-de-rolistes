const { Role } = require('../../models')

/**
 * Liste tous les rôles disponibles
 */
module.exports = async function controllerAdminRoles(req, res) {
  try {
    const roles = await Role.findAll({
      order: [['roleID', 'ASC']],
    })

    res.json(roles.map(role => ({
      roleID: role.roleID,
      roleLabel: role.roleLabel,
    })))
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}
