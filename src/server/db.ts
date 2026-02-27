// db.ts - configuration Sequelize pour bande_de_rolistes

import dotenv from 'dotenv'
import { Sequelize } from 'sequelize'

// Charger les variables d'environnement
dotenv.config()

const sequelize = new Sequelize(
  process.env.DB_NAME as string,
  process.env.DB_USER as string,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true,
    },
  }
)

// Vérification connexion DB
sequelize.authenticate()
  .then((): void => {
    console.log('✅ Connexion Sequelize OK à bande_de_rolistes')
  })
  .catch((error: Error): void => {
    console.error('❌ Erreur de connexion Sequelize :', error)
  })

export default sequelize
