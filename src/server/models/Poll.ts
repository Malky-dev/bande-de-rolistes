import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";

import sequelize from "../db";

class Poll extends Model<InferAttributes<Poll>, InferCreationAttributes<Poll>> {
  declare pollID: CreationOptional<number>;
  declare title: string;
  declare description: string | null;
  declare createdBy: number;
  declare maxSelections: number;
  declare endAt: Date;
  declare isClosedManually: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

Poll.init(
  {
    pollID: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: "poll_id",
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "created_by",
    },
    maxSelections: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "max_selections",
      validate: {
        min: 1,
      },
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "end_at",
    },
    isClosedManually: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "is_closed_manually",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "updated_at",
    },
  },
  {
    sequelize,
    modelName: "Poll",
    tableName: "Polls",
    timestamps: true,
  },
);

export default Poll;
