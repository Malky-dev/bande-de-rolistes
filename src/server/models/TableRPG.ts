import {
    DataTypes,
    Model,
    type InferAttributes,
    type InferCreationAttributes,
    type CreationOptional,
  } from 'sequelize'
  
  import sequelize from '../db'
  import User from './User'
  
  export type TableRPGStatus = 'OPEN' | 'CLOSED' | 'CANCELLED'
  
  class TableRPG extends Model<
    InferAttributes<TableRPG, { omit: 'created_at' | 'updated_at' }>,
    InferCreationAttributes<TableRPG, { omit: 'created_at' | 'updated_at' }>
  > {
    declare eventID: CreationOptional<number>
    declare eventDate: Date
    declare dungeon_master: number // User.userID
    declare location: string
    declare game: string
    declare comments: string | null
    declare status: TableRPGStatus
    declare maxPlayers: number
  
    declare created_at: CreationOptional<Date>
    declare updated_at: CreationOptional<Date>
  }
  
  TableRPG.init(
    {
      eventID: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: 'eventID',
      },
      eventDate: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'eventDate',
      },
      dungeon_master: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: 'dungeon_master',
      },
      location: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'location',
      },
      game: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: 'game',
      },
      comments: {
        type: DataTypes.TEXT,
        allowNull: true,
        field: 'comments',
      },
      status: {
        type: DataTypes.ENUM('OPEN', 'CLOSED', 'CANCELLED'),
        allowNull: false,
        defaultValue: 'OPEN',
        field: 'status',
      },
      maxPlayers: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        field: 'maxPlayers',
      },
    },
    {
      sequelize,
      tableName: 'tableRPG',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { name: 'idx_tableRPG_eventDate', fields: ['eventDate'] },
        { name: 'idx_tableRPG_status', fields: ['status'] },
      ],
    }
  )
  
  // Associations
  TableRPG.belongsTo(User, { foreignKey: 'dungeon_master', as: 'dungeonMaster' })
  User.hasMany(TableRPG, { foreignKey: 'dungeon_master', as: 'dmTables' })
  
  export default TableRPG