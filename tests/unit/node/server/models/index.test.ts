import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const modelsIndexUrl = pathToFileURL(
  path.join(root, "src/server/models/index.ts"),
).href;

const dbUrl = pathToFileURL(path.join(root, "src/server/db.ts")).href;
const userUrl = pathToFileURL(
  path.join(root, "src/server/models/User.ts"),
).href;
const roleUrl = pathToFileURL(
  path.join(root, "src/server/models/Role.ts"),
).href;
const sessionUrl = pathToFileURL(
  path.join(root, "src/server/models/Session.ts"),
).href;
const tableRpgUrl = pathToFileURL(
  path.join(root, "src/server/models/TableRPG.ts"),
).href;
const tableRpgPlayerUrl = pathToFileURL(
  path.join(root, "src/server/models/TableRPGPlayer.ts"),
).href;
const quoteUrl = pathToFileURL(
  path.join(root, "src/server/models/Quote.ts"),
).href;
const cotisationUrl = pathToFileURL(
  path.join(root, "src/server/models/Cotisation.ts"),
).href;
const pollUrl = pathToFileURL(
  path.join(root, "src/server/models/Poll.ts"),
).href;
const pollOptionUrl = pathToFileURL(
  path.join(root, "src/server/models/PollOption.ts"),
).href;
const pollVoteUrl = pathToFileURL(
  path.join(root, "src/server/models/PollVote.ts"),
).href;

async function load() {
  vi.resetModules();
  vi.clearAllMocks();

  const sequelize = { name: "sequelize" };

  const User = {
    hasMany: vi.fn(),
    belongsTo: vi.fn(),
    belongsToMany: vi.fn(),
  };

  const Role = {
    hasMany: vi.fn(),
  };

  const Session = {
    belongsTo: vi.fn(),
  };

  const TableRPG = {
    belongsTo: vi.fn(),
    hasMany: vi.fn(),
    belongsToMany: vi.fn(),
  };

  const TableRPGPlayer = {
    belongsTo: vi.fn(),
  };

  const Quote = {
    modelName: "Quote",
  };

  const Cotisation = {
    belongsTo: vi.fn(),
  };

  const Poll = {
    belongsTo: vi.fn(),
    hasMany: vi.fn(),
  };

  const PollOption = {
    belongsTo: vi.fn(),
    hasMany: vi.fn(),
  };

  const PollVote = {
    belongsTo: vi.fn(),
  };

  vi.doMock(dbUrl, () => ({
    __esModule: true,
    default: sequelize,
  }));

  vi.doMock(userUrl, () => ({
    __esModule: true,
    default: User,
  }));

  vi.doMock(roleUrl, () => ({
    __esModule: true,
    default: Role,
  }));

  vi.doMock(sessionUrl, () => ({
    __esModule: true,
    default: Session,
  }));

  vi.doMock(tableRpgUrl, () => ({
    __esModule: true,
    default: TableRPG,
  }));

  vi.doMock(tableRpgPlayerUrl, () => ({
    __esModule: true,
    default: TableRPGPlayer,
  }));

  vi.doMock(quoteUrl, () => ({
    __esModule: true,
    default: Quote,
  }));

  vi.doMock(cotisationUrl, () => ({
    __esModule: true,
    default: Cotisation,
  }));

  vi.doMock(pollUrl, () => ({
    __esModule: true,
    default: Poll,
  }));

  vi.doMock(pollOptionUrl, () => ({
    __esModule: true,
    default: PollOption,
  }));

  vi.doMock(pollVoteUrl, () => ({
    __esModule: true,
    default: PollVote,
  }));

  const mod = await import(modelsIndexUrl);

  return {
    mod,
    mocks: {
      sequelize,
      User,
      Role,
      Session,
      TableRPG,
      TableRPGPlayer,
      Quote,
      Cotisation,
      Poll,
      PollOption,
      PollVote,
    },
  };
}

describe("models index", () => {
  it("configure les associations et réexporte les symboles des modèles", async () => {
    const { mod, mocks } = await load();

    expect(mocks.Role.hasMany).toHaveBeenCalledTimes(1);
    expect(mocks.Role.hasMany).toHaveBeenCalledWith(mocks.User, {
      foreignKey: "roleID",
      as: "users",
    });

    expect(mocks.User.belongsTo).toHaveBeenCalledTimes(1);
    expect(mocks.User.belongsTo).toHaveBeenCalledWith(mocks.Role, {
      foreignKey: "roleID",
      as: "role",
    });

    expect(mocks.User.hasMany).toHaveBeenCalledTimes(6);
    expect(mocks.User.hasMany).toHaveBeenCalledWith(mocks.Session, {
      foreignKey: "userID",
      as: "sessions",
    });
    expect(mocks.User.hasMany).toHaveBeenCalledWith(mocks.Cotisation, {
      foreignKey: "userID",
      as: "cotisations",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    expect(mocks.User.hasMany).toHaveBeenCalledWith(mocks.TableRPG, {
      foreignKey: "dungeon_master",
      as: "dmTables",
    });
    expect(mocks.User.hasMany).toHaveBeenCalledWith(mocks.TableRPGPlayer, {
      foreignKey: "userID",
      as: "rpgSignups",
    });
    expect(mocks.User.hasMany).toHaveBeenCalledWith(mocks.Poll, {
      foreignKey: "createdBy",
      as: "createdPolls",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    expect(mocks.User.hasMany).toHaveBeenCalledWith(mocks.PollVote, {
      foreignKey: "userID",
      as: "pollVotes",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    expect(mocks.Session.belongsTo).toHaveBeenCalledTimes(1);
    expect(mocks.Session.belongsTo).toHaveBeenCalledWith(mocks.User, {
      foreignKey: "userID",
      as: "user",
    });

    expect(mocks.Cotisation.belongsTo).toHaveBeenCalledTimes(1);
    expect(mocks.Cotisation.belongsTo).toHaveBeenCalledWith(mocks.User, {
      foreignKey: "userID",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    expect(mocks.TableRPG.belongsTo).toHaveBeenCalledTimes(1);
    expect(mocks.TableRPG.belongsTo).toHaveBeenCalledWith(mocks.User, {
      foreignKey: "dungeon_master",
      as: "dungeonMaster",
    });

    expect(mocks.TableRPG.hasMany).toHaveBeenCalledTimes(1);
    expect(mocks.TableRPG.hasMany).toHaveBeenCalledWith(mocks.TableRPGPlayer, {
      foreignKey: "eventID",
      as: "signups",
    });

    expect(mocks.TableRPGPlayer.belongsTo).toHaveBeenCalledTimes(2);
    expect(mocks.TableRPGPlayer.belongsTo).toHaveBeenCalledWith(
      mocks.TableRPG,
      {
        foreignKey: "eventID",
        as: "event",
      },
    );
    expect(mocks.TableRPGPlayer.belongsTo).toHaveBeenCalledWith(mocks.User, {
      foreignKey: "userID",
      as: "user",
    });

    expect(mocks.TableRPG.belongsToMany).toHaveBeenCalledTimes(1);
    expect(mocks.TableRPG.belongsToMany).toHaveBeenCalledWith(mocks.User, {
      through: mocks.TableRPGPlayer,
      foreignKey: "eventID",
      otherKey: "userID",
      as: "players",
    });

    expect(mocks.User.belongsToMany).toHaveBeenCalledTimes(1);
    expect(mocks.User.belongsToMany).toHaveBeenCalledWith(mocks.TableRPG, {
      through: mocks.TableRPGPlayer,
      foreignKey: "userID",
      otherKey: "eventID",
      as: "joinedTables",
    });

    expect(mocks.Poll.belongsTo).toHaveBeenCalledTimes(1);
    expect(mocks.Poll.belongsTo).toHaveBeenCalledWith(mocks.User, {
      foreignKey: "createdBy",
      as: "author",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    expect(mocks.Poll.hasMany).toHaveBeenCalledTimes(2);
    expect(mocks.Poll.hasMany).toHaveBeenCalledWith(mocks.PollOption, {
      foreignKey: "pollID",
      as: "options",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    expect(mocks.Poll.hasMany).toHaveBeenCalledWith(mocks.PollVote, {
      foreignKey: "pollID",
      as: "votes",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    expect(mocks.PollOption.belongsTo).toHaveBeenCalledTimes(1);
    expect(mocks.PollOption.belongsTo).toHaveBeenCalledWith(mocks.Poll, {
      foreignKey: "pollID",
      as: "poll",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    expect(mocks.PollOption.hasMany).toHaveBeenCalledTimes(1);
    expect(mocks.PollOption.hasMany).toHaveBeenCalledWith(mocks.PollVote, {
      foreignKey: "optionID",
      as: "votes",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    expect(mocks.PollVote.belongsTo).toHaveBeenCalledTimes(3);
    expect(mocks.PollVote.belongsTo).toHaveBeenCalledWith(mocks.Poll, {
      foreignKey: "pollID",
      as: "poll",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    expect(mocks.PollVote.belongsTo).toHaveBeenCalledWith(mocks.PollOption, {
      foreignKey: "optionID",
      as: "option",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });
    expect(mocks.PollVote.belongsTo).toHaveBeenCalledWith(mocks.User, {
      foreignKey: "userID",
      as: "user",
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    });

    expect(mod.sequelize).toBe(mocks.sequelize);
    expect(mod.User).toBe(mocks.User);
    expect(mod.Role).toBe(mocks.Role);
    expect(mod.Session).toBe(mocks.Session);
    expect(mod.TableRPG).toBe(mocks.TableRPG);
    expect(mod.TableRPGPlayer).toBe(mocks.TableRPGPlayer);
    expect(mod.Quote).toBe(mocks.Quote);
    expect(mod.Cotisation).toBe(mocks.Cotisation);
    expect(mod.Poll).toBe(mocks.Poll);
    expect(mod.PollOption).toBe(mocks.PollOption);
    expect(mod.PollVote).toBe(mocks.PollVote);
  });
});
