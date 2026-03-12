import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const userModelUrl = pathToFileURL(
  path.join(root, "src/server/models/User.ts"),
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

  const mod = await import(userModelUrl);

  return { User: mod.default };
}

describe("model User", () => {
  it("définit les métadonnées de table attendues et les valeurs par défaut des champs", async () => {
    const { User } = await load();
    const attributes = User.getAttributes();

    expect(User.getTableName()).toBe("User");
    expect(User.primaryKeyAttribute).toBe("userID");
    expect(User.options.createdAt).toBe("created_at");
    expect(User.options.updatedAt).toBe("updated_at");

    expect(attributes.userID.primaryKey).toBe(true);
    expect(attributes.userID.autoIncrement).toBe(true);
    expect(attributes.userID.field).toBe("userID");

    expect(attributes.nickname.allowNull).toBe(false);
    expect(attributes.email.allowNull).toBe(false);
    expect(attributes.email.unique).toBe(true);

    expect(attributes.firstName.allowNull).toBe(true);
    expect(attributes.firstName.field).toBe("firstName");
    expect(attributes.lastName.allowNull).toBe(true);
    expect(attributes.phone.allowNull).toBe(true);

    expect(attributes.password.allowNull).toBe(false);
    expect(attributes.roleID.allowNull).toBe(false);
    expect(attributes.roleID.field).toBe("roleID");

    expect(attributes.isVerified.allowNull).toBe(false);
    expect(attributes.isVerified.defaultValue).toBe(false);
    expect(attributes.isVerified.field).toBe("isVerified");

    expect(attributes.discordId.allowNull).toBe(true);
    expect(attributes.discordId.unique).toBe(true);
    expect(attributes.discordId.field).toBe("discordId");
  });
});
