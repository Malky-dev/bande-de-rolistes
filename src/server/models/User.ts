import { DataTypes, type InferAttributes, type InferCreationAttributes, type CreationOptional, Model } from 'sequelize'
import sequelize from '../db'
import type Role from './Role'

class User extends Model<
  InferAttributes<User, { omit: 'created_at' | 'updated_at' }>,
  InferCreationAttributes<User, { omit: 'created_at' | 'updated_at' }>
> {
  declare userID: CreationOptional<number>
  declare nickname: string
  declare email: string
  declare password: string
  declare roleID: number
  declare isVerified: CreationOptional<boolean>
  declare discordId: string | null

  // timestamps (si tu les utilises côté code)
  declare created_at: CreationOptional<Date>
  declare updated_at: CreationOptional<Date>
}

User.init(
  {
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
  },
  {
    sequelize,
    tableName: 'User',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

export type UserWithRole = User & {
  role?: Role
}

export default User
