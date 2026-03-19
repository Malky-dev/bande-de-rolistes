import type { RequestHandler } from "express";
import { attachAuthContext } from "./authenticate";

const optionalAuth: RequestHandler = async (req, _res, next) => {
  try {
    await attachAuthContext(req);
    next();
  } catch (error) {
    console.error(error);
    next();
  }
};

export default optionalAuth;
