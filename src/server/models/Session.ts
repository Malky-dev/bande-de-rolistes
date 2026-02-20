import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
} from 'sequelize'

import sequelize from '../db'
import User from './User'

class Session extends Model<
  InferAttributes<Session, { omit: 'created_at' | 'updated_at' }>,
  InferCreationAttributes<Session, { omit: 'created_at' | 'updated_at' }>
> {
  declare sessionID: CreationOptional<number>
  declare userID: number
  declare token: string
  declare expiration: Date
  declare device: string | null
  declare browser: string | null

  // timestamps
  declare created_at: CreationOptional<Date>
  declare updated_at: CreationOptional<Date>
}

Session.init(
  {
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
  },
  {
    sequelize,
    tableName: 'Session',
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  }
)

// ---------------------------
// Associations
// ---------------------------
Session.belongsTo(User, { foreignKey: 'userID' })
User.hasMany(Session, { foreignKey: 'userID' })

export default Session
