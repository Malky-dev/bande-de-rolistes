const { DataTypes } = require('sequelize')
const sequelize = require('../db')
const User = require('./User')

const Session = sequelize.define('Session', {
  sessionID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'sessionID',
  },
  userID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'userID',
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  expiration: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  device: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  browser: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
}, {
  tableName: 'Session',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

Session.belongsTo(User, { foreignKey: 'userID' })
User.hasMany(Session, { foreignKey: 'userID' })

module.exports = Session

