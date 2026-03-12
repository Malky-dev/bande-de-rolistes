import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const quoteModelUrl = pathToFileURL(
  path.join(root, "src/server/models/Quote.ts"),
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

  const mod = await import(quoteModelUrl);

  return { Quote: mod.default };
}

describe("model Quote", () => {
  it("définit les métadonnées de table attendues et la valeur par défaut de l’auteur", async () => {
    const { Quote } = await load();
    const attributes = Quote.getAttributes();

    expect(Quote.getTableName()).toBe("Quote");
    expect(Quote.primaryKeyAttribute).toBe("quoteID");
    expect(Quote.options.createdAt).toBe("created_at");
    expect(Quote.options.updatedAt).toBe("updated_at");

    expect(attributes.quoteID.primaryKey).toBe(true);
    expect(attributes.quoteID.autoIncrement).toBe(true);
    expect(attributes.quoteID.field).toBe("quoteID");

    expect(attributes.content.allowNull).toBe(false);
    expect(attributes.author.allowNull).toBe(false);
    expect(attributes.author.defaultValue).toBe("Anonyme");
  });
});
