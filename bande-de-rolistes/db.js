// db.js - configuration Sequelize pour bande_de_rolistes
// pour lancer le script : npm run db:init

const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
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

sequelize.authenticate().then(() => {
  console.log('✅ Connexion Sequelize OK à bande_de_rolistes')
}).catch((error) => {
  console.error('❌ Erreur de connexion Sequelize :', error)
})

module.exports = sequelize