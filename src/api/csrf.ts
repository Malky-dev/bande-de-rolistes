import { readErrorMessage, readJsonObject } from "./http";

function isCsrfTokenResponse(value: object): value is { csrfToken: string } {
  return (
    "csrfToken" in value &&
    typeof value.csrfToken === "string" &&
    value.csrfToken.length > 0
  );
}

/**
 * Récupère un token CSRF frais.
 * Ne pas mettre en cache : le token est lié au cookie de session.
 */
export async function getCsrfToken(): Promise<string> {
  const res = await fetch("/api/csrf-token", {
    credentials: "include",
    method: "GET",
    cache: "no-store",
    headers: {
      "Cache-Control": "no-cache",
    },
  });

  if (!res.ok) {
    throw new Error(
      await readErrorMessage(res, "Impossible de récupérer le token CSRF"),
    );
  }

  const obj = await readJsonObject(res);

  if (!isCsrfTokenResponse(obj)) {
    console.error("Token CSRF invalide reçu:", obj);
    throw new Error("Token CSRF invalide reçu du serveur");
  }

  return obj.csrfToken;
}
