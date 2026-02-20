import sequelize from '../db'
import User, { type UserWithRole } from './User'
import Role from './Role'
import Session from './Session'

Role.hasMany(User, { foreignKey: 'roleID' })
User.belongsTo(Role, { foreignKey: 'roleID' })

export {
  sequelize,
  User,
  Role,
  Session,
  type UserWithRole,
}