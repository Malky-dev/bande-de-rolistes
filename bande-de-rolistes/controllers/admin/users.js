const { User, Role } = require('../../models')

/**
 * Liste tous les utilisateurs avec leurs rôles
 */
module.exports = async function controllerAdminUsers(req, res) {
  try {
    const users = await User.findAll({
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
      roleLabel: user.Role?.roleLabel || 'member',
      isVerified: user.isVerified,
    }))

    res.json(usersList)
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}
