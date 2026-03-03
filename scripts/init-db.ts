import sequelize from "../src/server/db";
import { Role, User, Cotisation } from "../src/server/models";

type RoleSeed = { roleID: number; roleLabel: string };

const ROLES: RoleSeed[] = [
  { roleID: 1, roleLabel: "admin" },
  { roleID: 2, roleLabel: "organisator" },
  { roleID: 3, roleLabel: "dungeon_master" },
  { roleID: 4, roleLabel: "member" },
  { roleID: 5, roleLabel: "guest" },
];

async function seedRoles(): Promise<void> {
  for (const r of ROLES) {
    await Role.upsert({
      roleID: r.roleID,
      roleLabel: r.roleLabel,
    });
  }
}

async function main(): Promise<void> {
  try {
    console.log("🔄 DB bootstrap: load models ...");

    console.log("🔄 DB bootstrap: sequelize.sync({ alter: true }) ...");
    await sequelize.sync({ alter: true });
    console.log("✅ Tables OK");

    console.log("🔄 Seed roles (upsert, IDs fixes 1–5) ...");
    await seedRoles();
    console.log("✅ Roles OK");

    console.log("🏁 DB bootstrap terminé");
  } catch (error) {
    console.error("❌ DB bootstrap erreur:", error);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

void main();
