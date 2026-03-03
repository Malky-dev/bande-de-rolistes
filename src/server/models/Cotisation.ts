import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  Model,
  type NonAttribute,
} from "sequelize";
import sequelize from "../db";
import type User from "./User";

class Cotisation extends Model<
  InferAttributes<Cotisation, { omit: "created_at" | "updated_at" | "user" }>,
  InferCreationAttributes<Cotisation, { omit: "created_at" | "updated_at" }>
> {
  declare cotisationID: CreationOptional<number>;

  declare userID: number;

  declare amountCents: number;
  declare status: CreationOptional<"paid">;
  declare paidAt: CreationOptional<Date>;

  declare periodStart: string;
  declare periodEnd: string;

  declare user?: NonAttribute<User>;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Cotisation.init(
  {
    cotisationID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "cotisationID",
    },

    userID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "userID",
    },

    amountCents: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "amountCents",
      validate: { min: 0 },
    },

    status: {
      type: DataTypes.ENUM("paid"),
      allowNull: false,
      defaultValue: "paid",
      field: "status",
    },

    paidAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "paidAt",
    },

    periodStart: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "periodStart",
    },

    periodEnd: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "periodEnd",
    },
  },
  {
    sequelize,
    tableName: "Cotisation",
    createdAt: "created_at",
    updatedAt: "updated_at",
    indexes: [{ fields: ["userID"] }, { fields: ["userID", "periodEnd"] }],
  },
);

export default Cotisation;
