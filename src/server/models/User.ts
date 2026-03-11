import {
  DataTypes,
  type InferAttributes,
  type InferCreationAttributes,
  type CreationOptional,
  Model,
  type NonAttribute,
} from "sequelize";
import sequelize from "../db";
import type Role from "./Role";

class User extends Model<
  InferAttributes<User, { omit: "created_at" | "updated_at" | "role" }>,
  InferCreationAttributes<User, { omit: "created_at" | "updated_at" }>
> {
  declare userID: CreationOptional<number>;
  declare nickname: string;

  // email reste obligatoire
  declare email: string;

  // nouveaux champs nullable
  declare firstName: string | null;
  declare lastName: string | null;
  declare phone: string | null;

  declare password: string;
  declare roleID: number;
  declare isVerified: CreationOptional<boolean>;
  declare discordId: string | null;

  declare role?: NonAttribute<Role>;

  declare created_at: CreationOptional<Date>;
  declare updated_at: CreationOptional<Date>;
}

User.init(
  {
    userID: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: "userID",
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

    firstName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "firstName",
    },

    lastName: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: "lastName",
    },

    phone: {
      type: DataTypes.STRING(30),
      allowNull: true,
      field: "phone",
    },

    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    roleID: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "roleID",
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: "isVerified",
    },
    discordId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
      field: "discordId",
    },
  },
  {
    sequelize,
    tableName: "User",
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
);

export type UserWithRole = User & { role?: Role };

export default User;
