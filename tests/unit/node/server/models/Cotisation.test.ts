import path from "node:path";
import { pathToFileURL } from "node:url";
import { DataTypes, Sequelize } from "sequelize";
import { describe, expect, it, vi } from "vitest";

const root = process.cwd();

const cotisationModelUrl = pathToFileURL(
  path.join(root, "src/server/models/Cotisation.ts"),
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

  const mod = await import(cotisationModelUrl);

  return { Cotisation: mod.default };
}

describe("model Cotisation", () => {
  it("définit les métadonnées attendues, la valeur par défaut de l’enum et les index", async () => {
    const { Cotisation } = await load();
    const attributes = Cotisation.getAttributes();
    const indexes = Cotisation.options.indexes ?? [];

    expect(Cotisation.getTableName()).toBe("Cotisation");
    expect(Cotisation.primaryKeyAttribute).toBe("cotisationID");
    expect(Cotisation.options.createdAt).toBe("created_at");
    expect(Cotisation.options.updatedAt).toBe("updated_at");

    expect(attributes.cotisationID.primaryKey).toBe(true);
    expect(attributes.cotisationID.autoIncrement).toBe(true);
    expect(attributes.cotisationID.field).toBe("cotisationID");

    expect(attributes.userID.allowNull).toBe(false);
    expect(attributes.userID.field).toBe("userID");

    expect(attributes.amountCents.allowNull).toBe(false);
    expect(attributes.amountCents.field).toBe("amountCents");
    expect(attributes.amountCents.validate?.min).toBe(0);

    expect(attributes.status.allowNull).toBe(false);
    expect(attributes.status.defaultValue).toBe("paid");
    expect(attributes.status.field).toBe("status");
    expect(attributes.status.values).toEqual(["paid"]);

    expect(attributes.paidAt.allowNull).toBe(false);
    expect(attributes.paidAt.defaultValue).toBeInstanceOf(DataTypes.NOW);
    expect(attributes.paidAt.field).toBe("paidAt");

    expect(attributes.periodStart.allowNull).toBe(false);
    expect(attributes.periodStart.field).toBe("periodStart");
    expect(attributes.periodEnd.allowNull).toBe(false);
    expect(attributes.periodEnd.field).toBe("periodEnd");

    expect(indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fields: ["userID"] }),
        expect.objectContaining({ fields: ["userID", "periodEnd"] }),
      ]),
    );
  });
});
