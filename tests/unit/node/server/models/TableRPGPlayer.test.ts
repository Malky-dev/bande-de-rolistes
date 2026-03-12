import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const tableRpgPlayerModelUrl = pathToFileURL(
  path.join(root, "src/server/models/TableRPGPlayer.ts"),
).href;

const dbUrl = pathToFileURL(path.join(root, "src/server/db.ts")).href;

async function load() {
  vi.resetModules();
  vi.clearAllMocks();

  const sequelize = new Sequelize("test", "user", undefined, {
    dialect: "mysql",
    logging: false,
  });

  vi.doMock(dbUrl, () => ({
    __esModule: true,
    default: sequelize,
  }));

  const mod = await import(tableRpgPlayerModelUrl);

  return { TableRPGPlayer: mod.default };
}

describe("model TableRPGPlayer", () => {
  it("définit les métadonnées attendues et les index composites", async () => {
    const { TableRPGPlayer } = await load();
    const attributes = TableRPGPlayer.getAttributes();
    const indexes = TableRPGPlayer.options.indexes ?? [];

    expect(TableRPGPlayer.getTableName()).toBe("tableRPGPlayer");
    expect(TableRPGPlayer.primaryKeyAttribute).toBe("signupID");
    expect(TableRPGPlayer.options.createdAt).toBe("created_at");
    expect(TableRPGPlayer.options.updatedAt).toBe("updated_at");

    expect(attributes.signupID.primaryKey).toBe(true);
    expect(attributes.signupID.autoIncrement).toBe(true);
    expect(attributes.signupID.field).toBe("signupID");

    expect(attributes.eventID.allowNull).toBe(false);
    expect(attributes.eventID.field).toBe("eventID");
    expect(attributes.userID.allowNull).toBe(false);
    expect(attributes.userID.field).toBe("userID");

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "uq_tableRPGPlayer_event_user",
          unique: true,
          fields: ["eventID", "userID"],
        }),
        expect.objectContaining({
          name: "idx_tableRPGPlayer_event_created",
          fields: ["eventID", "created_at"],
        }),
      ]),
    );
  });
});
