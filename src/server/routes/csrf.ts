// ---------------------------
// csrf.ts - Gestion CSRF
// ---------------------------

import { Router } from "express";
import { generateCsrfToken } from "../middleware/csrf";
import type { ApiError } from "../../types/api/errors";

const router = Router();

// ---------------------------
// Génération token CSRF
// ---------------------------

router.get("/csrf-token", (req, res) => {
  try {
    res.set({
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    });

    const token = generateCsrfToken(req, res);

    if (typeof token !== "string" || !token) {
      throw new Error("Token CSRF invalide");
    }

    res.json({ csrfToken: token });
  } catch (error) {
    console.error("Erreur génération token CSRF:", error);

    const message = error instanceof Error ? error.message : "Erreur serveur";
    const payload: ApiError = { code: "ERROR", message };

    res.status(500).json(payload);
  }
});

export default router;
