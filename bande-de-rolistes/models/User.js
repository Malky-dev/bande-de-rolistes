const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const User = sequelize.define('User', {
  userID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'userID',
  },
  nickname: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  roleID: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'roleID',
  },
  isVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'isVerified',
  },
  discordId: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    field: 'discordId',
  },
}, {
  tableName: 'User',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

module.exports = User

