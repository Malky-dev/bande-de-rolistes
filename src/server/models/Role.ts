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

class Role extends Model<
  InferAttributes<Role, { omit: "created_at" | "updated_at" | "users" }>,
  InferCreationAttributes<Role, { omit: "created_at" | "updated_at" }>
> {
  declare roleID: CreationOptional<number>;
  declare roleLabel: string;

  // association (Role.hasMany(User, { as: "users" }))
  declare users?: NonAttribute<User[]>;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

Role.init(
  {
    roleID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "roleID",
    },
    roleLabel: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "roleLabel",
    },
  },
  {
    sequelize,
    tableName: "Role",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export default Role;
