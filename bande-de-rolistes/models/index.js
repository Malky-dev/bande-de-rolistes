const sequelize = require('../db')
const User = require('./User')
const Role = require('./Role')
const Session = require('./Session')

Role.hasMany(User, { foreignKey: 'roleID' })
User.belongsTo(Role, { foreignKey: 'roleID' })

module.exports = {
  sequelize,
  User,
  Role,
  Session,
}

