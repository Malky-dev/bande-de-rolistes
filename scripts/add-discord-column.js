// scripts/add-discord-column.js
// Script pour ajouter la colonne discordId à la table User

const { sequelize } = require('../models')

async function main() {
  try {
    console.log('🔄 Ajout de la colonne discordId à la table User...')
    
    // Vérifier si la colonne existe déjà
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'bande_de_rolistes' 
      AND TABLE_NAME = 'User' 
      AND COLUMN_NAME = 'discordId'
    `)

    if (results.length > 0) {
      console.log('✅ La colonne discordId existe déjà')
      return
    }

    // Ajouter la colonne discordId
    await sequelize.query(`
      ALTER TABLE \`User\` 
      ADD COLUMN \`discordId\` VARCHAR(255) NULL UNIQUE 
      AFTER \`isVerified\`
    `)

    console.log('✅ Colonne discordId ajoutée avec succès')
    console.log('🏁 Migration terminée')
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error)
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️ La colonne existe déjà, aucune action nécessaire')
    } else {
      throw error
    }
  } finally {
    await sequelize.close()
  }
}

main()
