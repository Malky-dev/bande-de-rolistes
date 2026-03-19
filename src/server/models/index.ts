import sequelize from "../db";

import Cotisation from "./Cotisation";
import Poll from "./Poll";
import PollOption from "./PollOption";
import PollVote from "./PollVote";
import Quote from "./Quote";
import Role from "./Role";
import Session from "./Session";
import TableRPG from "./TableRPG";
import TableRPGPlayer from "./TableRPGPlayer";
import User, { type UserWithRole } from "./User";

// Associations Role <-> User
Role.hasMany(User, {
  foreignKey: "roleID",
  as: "users",
});

User.belongsTo(Role, {
  foreignKey: "roleID",
  as: "role",
});

// Associations User <-> Session
User.hasMany(Session, {
  foreignKey: "userID",
  as: "sessions",
});

Session.belongsTo(User, {
  foreignKey: "userID",
  as: "user",
});

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
User.hasMany(TableRPG, {
  foreignKey: "dungeon_master",
  as: "dmTables",
});

TableRPG.belongsTo(User, {
  foreignKey: "dungeon_master",
  as: "dungeonMaster",
});

// Associations TableRPG <-> TableRPGPlayer
TableRPG.hasMany(TableRPGPlayer, {
  foreignKey: "eventID",
  as: "signups",
});

TableRPGPlayer.belongsTo(TableRPG, {
  foreignKey: "eventID",
  as: "event",
});

// Associations User <-> TableRPGPlayer
User.hasMany(TableRPGPlayer, {
  foreignKey: "userID",
  as: "rpgSignups",
});

TableRPGPlayer.belongsTo(User, {
  foreignKey: "userID",
  as: "user",
});

// Associations TableRPG <-> User (many-to-many via TableRPGPlayer)
TableRPG.belongsToMany(User, {
  through: TableRPGPlayer,
  foreignKey: "eventID",
  otherKey: "userID",
  as: "players",
});

User.belongsToMany(TableRPG, {
  through: TableRPGPlayer,
  foreignKey: "userID",
  otherKey: "eventID",
  as: "joinedTables",
});

// Associations User <-> Poll
User.hasMany(Poll, {
  foreignKey: "createdBy",
  as: "createdPolls",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Poll.belongsTo(User, {
  foreignKey: "createdBy",
  as: "author",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Associations Poll <-> PollOption
Poll.hasMany(PollOption, {
  foreignKey: "pollID",
  as: "options",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PollOption.belongsTo(Poll, {
  foreignKey: "pollID",
  as: "poll",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Associations Poll <-> PollVote
Poll.hasMany(PollVote, {
  foreignKey: "pollID",
  as: "votes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PollVote.belongsTo(Poll, {
  foreignKey: "pollID",
  as: "poll",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Associations PollOption <-> PollVote
PollOption.hasMany(PollVote, {
  foreignKey: "optionID",
  as: "votes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PollVote.belongsTo(PollOption, {
  foreignKey: "optionID",
  as: "option",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

// Associations User <-> PollVote
User.hasMany(PollVote, {
  foreignKey: "userID",
  as: "pollVotes",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

PollVote.belongsTo(User, {
  foreignKey: "userID",
  as: "user",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

export {
  sequelize,
  Cotisation,
  Poll,
  PollOption,
  PollVote,
  Quote,
  Role,
  Session,
  TableRPG,
  TableRPGPlayer,
  User,
  type UserWithRole,
};
