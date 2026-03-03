import type { Request } from "express";
import { getCookieValue } from "../../utils/cookies";

export function extractAuthToken(req: Request): string | null {
  const cookieHeader = req.get("Cookie");
  const tokenFromCookie =
    typeof cookieHeader === "string"
      ? getCookieValue(cookieHeader, "bande_de_rolistes")
      : undefined;

  const tokenFromHeader =
    typeof req.headers.authorization === "string"
      ? req.headers.authorization.replace(/^Bearer\s+/i, "")
      : undefined;

  return tokenFromCookie || tokenFromHeader || null;
}
