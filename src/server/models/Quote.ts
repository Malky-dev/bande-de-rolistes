import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  Model,
} from "sequelize";
import sequelize from "../db";

class Quote extends Model<
  InferAttributes<Quote, { omit: "created_at" | "updated_at" }>,
  InferCreationAttributes<Quote, { omit: "created_at" | "updated_at" }>
> {
  declare quoteID: CreationOptional<number>;
  declare content: string;
  declare author: string;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Quote.init(
  {
    quoteID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "quoteID",
    },
    content: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: "Anonyme",
    },
  },
  {
    sequelize,
    tableName: "Quote",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Quote;
