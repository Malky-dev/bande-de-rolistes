// ---------------------------
// index.ts - API backend Bande de Rôlistes
// ---------------------------

import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";

import sequelize from "./db";

// Import routes
import authRoutes from "./routes/auth";
import sessionRoutes from "./routes/session";
import csrfRoutes from "./routes/csrf";
import discordRoutes from "./routes/discord";
import adminRoutes from "./routes/admin";
import accountRoutes from "./routes/account";
import rpgRoutes from "./routes/rpg";
import quoteRoutes from "./routes/quote";
import quotesRoutes from "./routes/quotes";
import cotisationRoutes from "./routes/cotisation";

// ---------------------------
// Création application
// ---------------------------

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// ---------------------------
// Middlewares globaux
// ---------------------------

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  }),
);

app.use(express.json());
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(compression());

// ---------------------------
// Montage routes API
// ---------------------------

app.use("/api", csrfRoutes);
app.use("/api", authRoutes);
app.use("/api", sessionRoutes);
app.use("/api", discordRoutes);
app.use("/api", adminRoutes);
app.use("/api", accountRoutes);
app.use("/api", rpgRoutes);
app.use("/api", quoteRoutes);
app.use("/api", quotesRoutes);
app.use("/api", cotisationRoutes);

// ---------------------------
// Initialisation base
// ---------------------------

async function initDatabase(): Promise<void> {
  await sequelize.authenticate();
  await sequelize.sync();
}

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API lancée sur http://localhost:${PORT}`);
    });
  })
  .catch((error: unknown) => {
    console.error("❌ Impossible d’initialiser la base de données");
    console.error(error);
    process.exit(1);
  });
