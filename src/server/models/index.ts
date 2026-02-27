import sequelize from '../db'
import User, { type UserWithRole } from './User'
import Role from './Role'
import Session from './Session'
import TableRPG from './TableRPG'
import TableRPGPlayer from './TableRPGPlayer'
import Quote from './Quote'

Role.hasMany(User, { foreignKey: 'roleID' })
User.belongsTo(Role, { foreignKey: 'roleID' })

export {
  sequelize,
  User,
  Role,
  Session,
  TableRPG,
  TableRPGPlayer,
  Quote,
  type UserWithRole,
}