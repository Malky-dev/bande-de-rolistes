import { apiSignupRpg, apiUnsignupRpg } from "@/api/rpg";

export async function signupToRpgTable(eventID: number): Promise<void> {
  await apiSignupRpg(eventID);
}

export async function unsignupFromRpgTable(eventID: number): Promise<void> {
  await apiUnsignupRpg(eventID);
}
