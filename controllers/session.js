const { Session, User, Role } = require('../models')

module.exports = async function controllerSession(req, res) {
  try {
    const token = req.cookies?.bande_de_rolistes

    if (!token || typeof token !== 'string') {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Session non trouvée' })
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

