import { describe, expect, it } from "vitest";

import { canCreateRpgTable, canEditRpgTable } from "@/client/utils/permissions";

describe("permissions - rpg", () => {
  it("canCreateRpgTable autorise uniquement les rôles 1, 2 et 3", () => {
    expect(canCreateRpgTable(null)).toBe(false);

    expect(
      canCreateRpgTable({
        userID: 1,
        nickname: "Neo",
        roleID: 1,
        role: "admin",
        isVerified: true,
      }),
    ).toBe(true);

    expect(
      canCreateRpgTable({
        userID: 1,
        nickname: "Neo",
        roleID: 2,
        role: "member",
        isVerified: true,
      }),
    ).toBe(true);

    expect(
      canCreateRpgTable({
        userID: 1,
        nickname: "Neo",
        roleID: 3,
        role: "member",
        isVerified: true,
      }),
    ).toBe(true);

    expect(
      canCreateRpgTable({
        userID: 1,
        nickname: "Neo",
        roleID: 4,
        role: "member",
        isVerified: true,
      }),
    ).toBe(false);
  });

  it("canEditRpgTable autorise un admin, un organisateur ou le maître du jeu", () => {
    const dungeonMasterUserID = 7;

    expect(canEditRpgTable(null, dungeonMasterUserID)).toBe(false);

    expect(
      canEditRpgTable(
        {
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        },
        dungeonMasterUserID,
      ),
    ).toBe(true);

    expect(
      canEditRpgTable(
        {
          userID: 2,
          nickname: "Orga",
          roleID: 2,
          role: "member",
          isVerified: true,
        },
        dungeonMasterUserID,
      ),
    ).toBe(true);

    expect(
      canEditRpgTable(
        {
          userID: 7,
          nickname: "DM",
          roleID: 5,
          role: "member",
          isVerified: true,
        },
        dungeonMasterUserID,
      ),
    ).toBe(true);

    expect(
      canEditRpgTable(
        {
          userID: 8,
          nickname: "Other",
          roleID: 5,
          role: "member",
          isVerified: true,
        },
        dungeonMasterUserID,
      ),
    ).toBe(false);
  });

  it("canEditRpgTable refuse quand le maître du jeu est absent", () => {
    expect(
      canEditRpgTable(
        {
          userID: 7,
          nickname: "DM",
          roleID: 5,
          role: "member",
          isVerified: true,
        },
        null,
      ),
    ).toBe(false);
  });
});
