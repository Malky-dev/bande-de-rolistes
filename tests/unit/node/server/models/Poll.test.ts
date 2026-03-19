import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const pollModelUrl = pathToFileURL(
  path.join(root, "src/server/models/Poll.ts"),
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

  const mod = await import(pollModelUrl);

  return { Poll: mod.default };
}

describe("model Poll", () => {
  it("définit les métadonnées de table attendues et les champs du sondage", async () => {
    const { Poll } = await load();
    const attributes = Poll.getAttributes();

    expect(Poll.getTableName()).toBe("Polls");
    expect(Poll.primaryKeyAttribute).toBe("pollID");
    expect(Poll.options.timestamps).toBe(true);

    expect(attributes.pollID.primaryKey).toBe(true);
    expect(attributes.pollID.autoIncrement).toBe(true);

    expect(attributes.title.allowNull).toBe(false);
    expect(attributes.title.type).toBeDefined();

    expect(attributes.description.allowNull).toBe(true);
    expect(attributes.description.defaultValue).toBe(null);

    expect(attributes.createdBy.allowNull).toBe(false);

    expect(attributes.maxSelections.allowNull).toBe(false);
    expect(attributes.maxSelections.validate).toEqual({ min: 1 });

    expect(attributes.endAt.allowNull).toBe(false);

    expect(attributes.isClosedManually.allowNull).toBe(false);
    expect(attributes.isClosedManually.defaultValue).toBe(false);

    expect(attributes.createdAt.allowNull).toBe(false);
    expect(attributes.updatedAt.allowNull).toBe(false);
  });
});
