import type { RequestHandler } from "express";

import { hashPassword } from "../global";
import { User } from "../models";
import {
  EMAIL_REGEX,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
} from "../constants";
import type { ApiError } from "../../types/api/errors";

type SigninBody = {
  nickname: string;
  email: string;
  password: string;
  passwordCheck: string;
};

type SigninSuccess = {
  code: "SUCCESS";
  message: string;
};

type SigninResponse = SigninSuccess | ApiError;

type SequelizeValidationErrorShape = Error & {
  errors?: Array<{ message?: string }>;
};

// ---------------------------
// Contrôleur Signin
// ---------------------------
const controllerSignin: RequestHandler<
  Record<string, never>,
  SigninResponse,
  SigninBody
> = async (req, res): Promise<void> => {
  try {
    const { nickname, email, password, passwordCheck } = req.body;

    // ---------------------------
    // Validation types
    // ---------------------------
    if (typeof nickname !== "string") {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Le pseudo doit être une chaîne de caractères",
      });
      return;
    }

    if (typeof email !== "string") {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "L'email doit être une chaîne de caractères",
      });
      return;
    }

    if (typeof password !== "string") {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Le mot de passe doit être une chaîne de caractères",
      });
      return;
    }

    if (typeof passwordCheck !== "string") {
      res.status(400).json({
        code: "BAD_REQUEST",
        message:
          "La confirmation du mot de passe doit être une chaîne de caractères",
      });
      return;
    }

    if (password !== passwordCheck) {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Les mots de passe ne correspondent pas",
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // ---------------------------
    // Vérification du format email
    // ---------------------------
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "L'email n'est pas valide" });
      return;
    }

    // ---------------------------
    // Vérification du mot de passe
    // ---------------------------
    if (password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: `Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères`,
      });
      return;
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Le mot de passe est trop long",
      });
      return;
    }

    if (password.toLowerCase() === normalizedEmail) {
      res.status(400).json({
        code: "BAD_REQUEST",
        message: "Le mot de passe ne peut pas être identique à l'email",
      });
      return;
    }

    if (/^(.)\1+$/.test(password)) {
      res
        .status(400)
        .json({ code: "BAD_REQUEST", message: "Mot de passe trop simple" });
      return;
    }

    // ---------------------------
    // Vérification user existant
    // ---------------------------
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) {
      res
        .status(409)
        .json({ code: "DUPLICATE", message: "L'utilisateur existe déjà" });
      return;
    }

    // ---------------------------
    // Création utilisateur
    // ---------------------------
    const hashedPassword = await hashPassword(password);

    await User.create({
      nickname,
      email: normalizedEmail,
      password: hashedPassword,
      roleID: 5, // guest par défaut
    });

    res.status(201).json({
      code: "SUCCESS",
      message: "L'utilisateur a été créé avec succès",
    });
  } catch (error) {
    console.error(error);

    const err = error instanceof Error ? error : new Error("Erreur serveur");

    if (err.name === "SequelizeValidationError") {
      const validation = err as SequelizeValidationErrorShape;
      const details = Array.isArray(validation.errors)
        ? validation.errors
            .map((e) => (typeof e.message === "string" ? e.message : ""))
            .filter((m) => m.length > 0)
            .join(", ")
        : "";

      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: details.length > 0 ? details : "Validation error",
      });
      return;
    }

    if (err.name === "SequelizeUniqueConstraintError") {
      res.status(409).json({
        code: "DUPLICATE",
        message: "Cet email ou ce pseudo est déjà utilisé",
      });
      return;
    }

    if (err.name === "SequelizeForeignKeyConstraintError") {
      res.status(400).json({
        code: "FOREIGN_KEY_ERROR",
        message:
          "Le rôle spécifié n'existe pas. Veuillez contacter l'administrateur.",
      });
      return;
    }

    res.status(500).json({
      code: "ERROR",
      message: err.message.length > 0 ? err.message : "Erreur serveur",
    });
  }
};

export default controllerSignin;
