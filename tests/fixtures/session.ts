import type { SessionInfo } from "@/types/api/session";

export function makeMemberSession(
  overrides: Partial<SessionInfo> = {},
): SessionInfo {
  return {
    userID: 1,
    nickname: "Raoul",
    roleID: 2,
    role: "member",
    isVerified: true,
    ...overrides,
  };
}
