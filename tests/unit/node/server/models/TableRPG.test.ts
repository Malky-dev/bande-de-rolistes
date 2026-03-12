import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const tableRpgModelUrl = pathToFileURL(
  path.join(root, "src/server/models/TableRPG.ts"),
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

  const mod = await import(tableRpgModelUrl);

  return { TableRPG: mod.default };
}

describe("model TableRPG", () => {
  it("définit les métadonnées attendues, la valeur par défaut de l’enum et les index", async () => {
    const { TableRPG } = await load();
    const attributes = TableRPG.getAttributes();
    const indexes = TableRPG.options.indexes ?? [];

    expect(TableRPG.getTableName()).toBe("tableRPG");
    expect(TableRPG.primaryKeyAttribute).toBe("eventID");
    expect(TableRPG.options.createdAt).toBe("created_at");
    expect(TableRPG.options.updatedAt).toBe("updated_at");

    expect(attributes.eventID.primaryKey).toBe(true);
    expect(attributes.eventID.autoIncrement).toBe(true);
    expect(attributes.eventID.field).toBe("eventID");

    expect(attributes.eventDate.allowNull).toBe(false);
    expect(attributes.eventDate.field).toBe("eventDate");

    expect(attributes.dungeon_master.allowNull).toBe(false);
    expect(attributes.dungeon_master.field).toBe("dungeon_master");

    expect(attributes.location.allowNull).toBe(false);
    expect(attributes.game.allowNull).toBe(false);
    expect(attributes.comments.allowNull).toBe(true);

    expect(attributes.status.allowNull).toBe(false);
    expect(attributes.status.defaultValue).toBe("OPEN");
    expect(attributes.status.values).toEqual(["OPEN", "CLOSED", "CANCELLED"]);

    expect(attributes.maxPlayers.allowNull).toBe(false);
    expect(attributes.maxPlayers.defaultValue).toBe(10);
    expect(attributes.maxPlayers.field).toBe("maxPlayers");

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "idx_tableRPG_eventDate",
          fields: ["eventDate"],
        }),
        expect.objectContaining({
          name: "idx_tableRPG_status",
          fields: ["status"],
        }),
      ]),
    );
  });
});
