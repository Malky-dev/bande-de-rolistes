// scripts/init-db.js
// Script pour créer / synchroniser les tables et insérer les rôles par défaut

const { sequelize, Role } = require('../models')

async function main() {
  try {
    console.log('🔄 Synchronisation des modèles (alter)...')
    await sequelize.sync({ alter: true })

    console.log('✅ Tables synchronisées')

    console.log('🗑️ Réinitialisation de la table Role (désactivation temporaire des FK)...')
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0')
    await Role.destroy({ where: {} })

    const roles = [
      { roleID: 1, roleLabel: 'admin' },
      { roleID: 2, roleLabel: 'organisator' },
      { roleID: 3, roleLabel: 'dungeon_master' },
      { roleID: 4, roleLabel: 'member' },
      { roleID: 5, roleLabel: 'guest' },
    ]

    await Role.bulkCreate(roles)
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1')

    console.log('✅ Rôles insérés avec IDs fixes (1–5)')
    console.log('🏁 Initialisation terminée')
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de la base :', error)
  } finally {
    await sequelize.close()
  }
}

main()

