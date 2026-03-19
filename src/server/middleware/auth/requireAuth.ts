import type { RequestHandler } from "express";
import { attachAuthContext } from "./authenticate";

const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const authenticated = await attachAuthContext(req);

    if (!authenticated) {
      res.status(401).json({
        code: "UNAUTHORIZED",
        message: "Authentification requise",
      });
      return;
    }

    next();
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Erreur serveur";
    res.status(500).json({ code: "ERROR", message });
  }
};

export default requireAuth;
