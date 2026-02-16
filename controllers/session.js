const { Session, User, Role } = require('../models')

module.exports = async function controllerSession(req, res) {
  try {
    const { token } = req.params

    if (typeof token !== 'string') {
      throw new TypeError('le token doit être une chaîne de caractères')
    }

    const session = await Session.findOne({
      where: { token },
      include: {
        model: User,
        required: true,
        include: {
          model: Role,
          required: true,
        },
      },
    })

    if (!session || !session.User) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Token de session non disponible' })
    }

    const user = session.User
    const role = user.Role

    res.json({
      nickname: user.nickname,
      role: role?.roleLabel || 'member',
      isVerified: !!user.isVerified,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}

