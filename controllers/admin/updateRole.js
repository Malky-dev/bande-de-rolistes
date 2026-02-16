const { User, Role } = require('../../models')

/**
 * Modifie le rôle d'un utilisateur
 */
module.exports = async function controllerAdminUpdateRole(req, res) {
  try {
    const { userID } = req.params
    const { roleID } = req.body

    if (!userID || !roleID) {
      return res.status(400).json({ 
        code: 'BAD_REQUEST', 
        message: 'userID and roleID are required' 
      })
    }

    // Vérifier que le rôle existe
    const role = await Role.findByPk(roleID)
    if (!role) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'Role not found' 
      })
    }

    // Vérifier que l'utilisateur existe
    const user = await User.findByPk(userID)
    if (!user) {
      return res.status(404).json({ 
        code: 'NOT_FOUND', 
        message: 'User not found' 
      })
    }

    // Empêcher de modifier son propre rôle (sécurité)
    if (user.userID === req.user.userID) {
      return res.status(403).json({ 
        code: 'FORBIDDEN', 
        message: 'Cannot modify your own role' 
      })
    }

    // Mettre à jour le rôle
    await user.update({ roleID })

    // Récupérer l'utilisateur mis à jour avec le nouveau rôle
    const updatedUser = await User.findByPk(userID, {
      include: {
        model: Role,
        required: true,
      },
    })

    res.json({
      userID: updatedUser.userID,
      nickname: updatedUser.nickname,
      email: updatedUser.email,
      roleID: updatedUser.roleID,
      roleLabel: updatedUser.Role?.roleLabel || 'member',
      isVerified: updatedUser.isVerified,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}
