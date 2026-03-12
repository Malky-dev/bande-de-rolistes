import path from "node:path";
import { pathToFileURL } from "node:url";
import { Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const roleModelUrl = pathToFileURL(
  path.join(root, "src/server/models/Role.ts"),
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

  const mod = await import(roleModelUrl);

  return { Role: mod.default };
}

describe("model Role", () => {
  it("définit les métadonnées de table attendues et les champs du rôle", async () => {
    const { Role } = await load();
    const attributes = Role.getAttributes();

    expect(Role.getTableName()).toBe("Role");
    expect(Role.primaryKeyAttribute).toBe("roleID");
    expect(Role.options.createdAt).toBe("created_at");
    expect(Role.options.updatedAt).toBe("updated_at");

    expect(attributes.roleID.primaryKey).toBe(true);
    expect(attributes.roleID.autoIncrement).toBe(true);
    expect(attributes.roleID.field).toBe("roleID");

    expect(attributes.roleLabel.allowNull).toBe(false);
    expect(attributes.roleLabel.field).toBe("roleLabel");
  });
});
