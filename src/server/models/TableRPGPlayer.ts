import {
  DataTypes,
  Model,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  type NonAttribute,
} from "sequelize";

import sequelize from "../db";
import type User from "./User";
import type TableRPG from "./TableRPG";

class TableRPGPlayer extends Model<
  InferAttributes<
    TableRPGPlayer,
    { omit: "created_at" | "updated_at" | "user" | "event" }
  >,
  InferCreationAttributes<TableRPGPlayer, { omit: "created_at" | "updated_at" }>
> {
  declare signupID: CreationOptional<number>;
  declare eventID: number;
  declare userID: number;

  // assocs
  declare event?: NonAttribute<TableRPG>;
  declare user?: NonAttribute<User>;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

TableRPGPlayer.init(
  {
    signupID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "signupID",
    },
    eventID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "eventID",
    },
    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "userID",
    },
  },
  {
    sequelize,
    tableName: "tableRPGPlayer",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [
      {
        name: "uq_tableRPGPlayer_event_user",
        unique: true,
        fields: ["eventID", "userID"],
      },
      {
        name: "idx_tableRPGPlayer_event_created",
        fields: ["eventID", "created_at"],
      },
    ],
  },
);

export default TableRPGPlayer;
