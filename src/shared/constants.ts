/* =========================================================
   Constantes partagées (client + server)
   - Garder ce fichier libre de Node/Express/DB imports.
   - Seuls les données/constantes pures doivent vivre ici.
========================================================= */

/* =========================
   Auth / Security
========================= */

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const MIN_PASSWORD_LENGTH = 12;
export const MAX_PASSWORD_LENGTH = 128;

// bcrypt cost
export const BCRYPT_SALT_ROUNDS = 12;

/* =========================
   Limitation des requêtes
========================= */

export const RATELIMIT = 500;
export const WINDOWMS = 15 * 60 * 1000;

/* =========================
   API
========================= */

// NOTE: actuellement non utilisé dans le codebase, mais gardé comme constante partagée pour une future utilisation.
export const API_URL = "http://localhost:3000/api";

/* =========================
   Quotes
========================= */

export const QUOTES_PAGE_SIZE = 10;
export const SALT_ROUNDS = 12;

/* =========================
   RPG
========================= */

export const RPG_TABLE_STATUSES = ["OPEN", "CLOSED", "CANCELLED"] as const;
export type RpgTableStatus = (typeof RPG_TABLE_STATUSES)[number];

export const RPG_STATUS_LABELS: Record<RpgTableStatus, string> = {
  OPEN: "Ouvert à l'inscription",
  CLOSED: "Fermée à l'inscription",
  CANCELLED: "Table annulée",
};

export const RPG_LOCATIONS = [
  "EVA de Maurepas",
  "Salle Oxford",
  "Autre (voir description)",
] as const;

export const RPG_MAX_PLAYERS_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

// Utilisé par la réponse GET /rpg/tables/:eventID
export const RPG_HARD_CAP = 6;

// IDs de rôles utilisés pour les permissions RPG (voir controllers)
export const RPG_ALLOWED_CREATE_ROLE_IDS = [1, 2, 3] as const;
export const RPG_ALLOWED_DM_ROLE_IDS = [1, 2, 3] as const;
export const RPG_ALLOWED_PLAYER_ROLE_IDS = [1, 2, 3, 4, 5] as const;
export const RPG_ADMIN_OR_ORGA_ROLE_IDS = [1, 2] as const;

/* =========================
   POLLS
========================= */

export const INITIAL_RELOAD_TOKEN = 0;
