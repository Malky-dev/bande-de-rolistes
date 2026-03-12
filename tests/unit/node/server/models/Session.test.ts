import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const sessionModelUrl = pathToFileURL(
  path.join(root, "src/server/models/Session.ts"),
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

  const mod = await import(sessionModelUrl);

  return { Session: mod.default };
}

describe("model Session", () => {
  it("définit les métadonnées de table attendues et les champs de session nullables", async () => {
    const { Session } = await load();
    const attributes = Session.getAttributes();

    expect(Session.getTableName()).toBe("Session");
    expect(Session.primaryKeyAttribute).toBe("sessionID");
    expect(Session.options.createdAt).toBe("created_at");
    expect(Session.options.updatedAt).toBe("updated_at");

    expect(attributes.sessionID.primaryKey).toBe(true);
    expect(attributes.sessionID.autoIncrement).toBe(true);
    expect(attributes.sessionID.field).toBe("sessionID");

    expect(attributes.userID.allowNull).toBe(false);
    expect(attributes.userID.field).toBe("userID");

    expect(attributes.token.allowNull).toBe(false);
    expect(attributes.token.unique).toBe(true);

    expect(attributes.expiration.allowNull).toBe(false);
    expect(attributes.device.allowNull).toBe(true);
    expect(attributes.browser.allowNull).toBe(true);
  });
});
