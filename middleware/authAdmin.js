const { Session, User, Role } = require('../models')
const { Op } = require('sequelize')

/**
 * Middleware pour vérifier que l'utilisateur est admin
 * Attend un token dans les cookies ou dans le header Authorization
 */
async function requireAdmin(req, res, next) {
  try {
    // Récupérer le token depuis les cookies (httpOnly) ou le header Authorization
    const token = req.cookies?.bande_de_rolistes || 
                  req.headers.authorization?.replace('Bearer ', '')

    if (!token || typeof token !== 'string') {
      console.log('❌ Admin middleware: Token manquant', {
        cookies: req.cookies,
        authHeader: req.headers.authorization,
      })
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Token required' })
    }

    console.log('🔍 Admin middleware: Token trouvé, vérification de la session...')

    // Vérifier la session et récupérer l'utilisateur avec son rôle
    const session = await Session.findOne({
      where: { 
        token,
        expiration: {
          [Op.gt]: new Date(), // Session non expirée
        },
      },
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
      console.log('❌ Admin middleware: Session invalide ou utilisateur introuvable')
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid token' })
    }

    // Vérifier que l'utilisateur est admin
    const role = session.User.Role
    if (!role || role.roleLabel !== 'admin') {
      console.log('❌ Admin middleware: Rôle insuffisant', {
        userId: session.User.userID,
        roleLabel: role?.roleLabel,
      })
      return res.status(403).json({ code: 'FORBIDDEN', message: 'Admin access required' })
    }

    console.log('✅ Admin middleware: Accès autorisé pour', session.User.nickname)

    // Ajouter l'utilisateur à la requête pour utilisation dans les contrôleurs
    req.user = session.User
    req.session = session
    next()
  } catch (error) {
    console.error(error)
    res.status(500).json({ code: 'ERROR', message: error.message })
  }
}

module.exports = requireAdmin
