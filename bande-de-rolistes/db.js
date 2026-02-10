// db.js - configuration Sequelize pour bande_de_rolistes
// pour lancer le script : npm run db:init

const { Sequelize } = require('sequelize')

const sequelize = new Sequelize('bande_de_rolistes', 'root', 'password', {
  host: 'localhost',
  dialect: 'mysql',
  logging: false,
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
})

async function testConnection() {
  try {
    await sequelize.authenticate()
    console.log('✅ Connexion Sequelize OK à bande_de_rolistes')
  } catch (error) {
    console.error('❌ Erreur de connexion Sequelize :', error)
  }
}

testConnection()

module.exports = sequelize