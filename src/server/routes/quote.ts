import { Router } from "express";
import { Quote } from "../models";

const router = Router();

router.get("/quote", async (_req, res) => {
  try {
    const count = await Quote.count();

    if (count === 0) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Aucune citation disponible",
      });
      return;
    }

    const randomOffset = Math.floor(Math.random() * count);

    const quote = await Quote.findOne({
      order: [["quoteID", "ASC"]],
      offset: randomOffset,
      limit: 1,
      attributes: ["content", "author"],
    });

    if (!quote) {
      res.status(404).json({
        code: "NOT_FOUND",
        message: "Aucune citation disponible",
      });
      return;
    }

    res.json({
      content: quote.content,
      author: quote.author,
    });
  } catch {
    res.status(500).json({
      code: "ERROR",
      message: "Erreur lors de la récupération de la citation",
    });
  }
});

export default router;
