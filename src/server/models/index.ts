import sequelize from "../db";
import User, { type UserWithRole } from "./User";
import Role from "./Role";
import Session from "./Session";
import TableRPG from "./TableRPG";
import TableRPGPlayer from "./TableRPGPlayer";
import Quote from "./Quote";
import Cotisation from "./Cotisation";

// Associations Role <-> User
Role.hasMany(User, { foreignKey: "roleID", as: "users" });
User.belongsTo(Role, { foreignKey: "roleID", as: "role" });

// Associations User <-> Session
User.hasMany(Session, { foreignKey: "userID", as: "sessions" });
Session.belongsTo(User, { foreignKey: "userID", as: "user" });

// Associations User <-> Cotisation
User.hasMany(Cotisation, {
  foreignKey: "userID",
  as: "cotisations",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});
Cotisation.belongsTo(User, {
  foreignKey: "userID",
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Associations User <-> TableRPG
TableRPG.belongsTo(User, { foreignKey: "dungeon_master", as: "dungeonMaster" });
User.hasMany(TableRPG, { foreignKey: "dungeon_master", as: "dmTables" });

// Join table -> parents
TableRPGPlayer.belongsTo(TableRPG, { foreignKey: "eventID", as: "event" });
TableRPG.hasMany(TableRPGPlayer, { foreignKey: "eventID", as: "signups" });

TableRPGPlayer.belongsTo(User, { foreignKey: "userID", as: "user" });
User.hasMany(TableRPGPlayer, { foreignKey: "userID", as: "rpgSignups" });

// Associations TableRPG <-> User
TableRPG.belongsToMany(User, {
  through: TableRPGPlayer,
  foreignKey: "eventID",
  otherKey: "userID",
  as: "players",
});

// Associations User <-> TableRPG
User.belongsToMany(TableRPG, {
  through: TableRPGPlayer,
  foreignKey: "userID",
  otherKey: "eventID",
  as: "joinedTables",
});

export {
  sequelize,
  User,
  Role,
  Session,
  TableRPG,
  TableRPGPlayer,
  Quote,
  Cotisation,
  type UserWithRole,
};
