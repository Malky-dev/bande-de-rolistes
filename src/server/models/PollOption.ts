import { DataTypes, Model } from "sequelize";
import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";

import sequelize from "../db";

class PollOption extends Model<
  InferAttributes<PollOption>,
  InferCreationAttributes<PollOption>
> {
  declare optionID: CreationOptional<number>;
  declare pollID: number;
  declare label: string;
  declare displayOrder: number;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

PollOption.init(
  {
    optionID: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
      field: "option_id",
    },
    pollID: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      field: "poll_id",
    },
    label: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    displayOrder: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      defaultValue: 0,
      field: "display_order",
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
    modelName: "PollOption",
    tableName: "PollOptions",
    timestamps: true,
  },
);

export default PollOption;
