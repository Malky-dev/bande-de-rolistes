import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";
import { WINDOWMS, RATELIMIT } from "../constants";

export const requestLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: WINDOWMS,
  max: RATELIMIT,
  message: "Trop de tentatives, réessayez plus tard.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
