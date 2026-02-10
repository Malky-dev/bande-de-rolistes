const { DataTypes } = require('sequelize')
const sequelize = require('../db')

const Role = sequelize.define('Role', {
  roleID: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    field: 'roleID',
  },
  roleLabel: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'roleLabel',
  },
}, {
  tableName: 'Role',
  createdAt: 'created_at',
  updatedAt: 'updated_at',
})

module.exports = Role

