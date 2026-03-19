import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const pollOptionModelUrl = pathToFileURL(
  path.join(root, "src/server/models/PollOption.ts"),
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

  const mod = await import(pollOptionModelUrl);

  return { PollOption: mod.default };
}

describe("model PollOption", () => {
  it("définit les métadonnées de table attendues et les champs de l'option", async () => {
    const { PollOption } = await load();
    const attributes = PollOption.getAttributes();

    expect(PollOption.getTableName()).toBe("PollOptions");
    expect(PollOption.primaryKeyAttribute).toBe("optionID");
    expect(PollOption.options.timestamps).toBe(true);

    expect(attributes.optionID.primaryKey).toBe(true);
    expect(attributes.optionID.autoIncrement).toBe(true);

    expect(attributes.pollID.allowNull).toBe(false);

    expect(attributes.label.allowNull).toBe(false);

    expect(attributes.displayOrder.allowNull).toBe(false);
    expect(attributes.displayOrder.defaultValue).toBe(0);

    expect(attributes.createdAt.allowNull).toBe(false);
    expect(attributes.updatedAt.allowNull).toBe(false);
  });
});
