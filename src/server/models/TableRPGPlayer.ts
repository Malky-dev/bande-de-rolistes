import {
    DataTypes,
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
  } from 'sequelize'
  
  import sequelize from '../db'
  import User from './User'
  import TableRPG from './TableRPG'
  
  class TableRPGPlayer extends Model<
    InferAttributes<TableRPGPlayer, { omit: 'created_at' | 'updated_at' }>,
    InferCreationAttributes<TableRPGPlayer, { omit: 'created_at' | 'updated_at' }>
  > {
    declare signupID: CreationOptional<number>
    declare eventID: number
    declare userID: number
  
    declare created_at: CreationOptional<Date>
    declare updated_at: CreationOptional<Date>
  }
  
  TableRPGPlayer.init(
    {
      signupID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'signupID',
      },
      eventID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'eventID',
      },
      userID: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'userID',
      },
    },
    {
      sequelize,
      tableName: 'tableRPGPlayer',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'uq_tableRPGPlayer_event_user', unique: true, fields: ['eventID', 'userID'] },
        { name: 'idx_tableRPGPlayer_event_created', fields: ['eventID', 'created_at'] },
      ],
    }
  )
  
  // Associations
  TableRPGPlayer.belongsTo(TableRPG, { foreignKey: 'eventID' })
  TableRPG.hasMany(TableRPGPlayer, { foreignKey: 'eventID', as: 'signups' })
  
  TableRPGPlayer.belongsTo(User, { foreignKey: 'userID' })
  User.hasMany(TableRPGPlayer, { foreignKey: 'userID', as: 'rpgSignups' })
  
  export default TableRPGPlayer