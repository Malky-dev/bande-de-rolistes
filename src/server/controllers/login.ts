import type { RequestHandler } from "express";
import DeviceDetector from "device-detector-js";
import { comparePassword, generateSessionToken } from "../global";
import { User, Session, Role } from "../models";
import type {
  LoginBody,
  LoginResponse,
  LoginSuccess,
} from "../../types/api/auth";
import type { ApiError } from "../../types/api/errors";

type DeviceParseResult = {
  device?: { type?: string };
  client?: { name?: string };
};

function isUserWithPassword(
  value: object,
): value is { userID: number; password: string } {
  return (
    "userID" in value &&
    typeof (value as { userID?: number }).userID === "number" &&
    "password" in value &&
    typeof (value as { password?: string }).password === "string"
  );
}

const controllerLogin: RequestHandler<
  Record<string, never>,
  LoginResponse,
  LoginBody
> = async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (typeof email !== "string") {
      const payload: ApiError = {
        code: "BAD_REQUEST",
        message: "l'email est invalide",
      };
      res.status(400).json(payload);
      return;
    }

    if (typeof password !== "string") {
      const payload: ApiError = {
        code: "BAD_REQUEST",
        message: "le mot de passe doit être une chaîne de caractères",
      };
      res.status(400).json(payload);
      return;
    }

    const userRaw = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "role" }],
    });

    if (
      typeof userRaw !== "object" ||
      userRaw === null ||
      !isUserWithPassword(userRaw)
    ) {
      const payload: ApiError = {
        code: "NOT_FOUND",
        message: "Le nom d'utilisateur n'est pas disponible",
      };
      res.status(404).json(payload);
      return;
    }

    const isPasswordValid = await comparePassword(password, userRaw.password);
    if (!isPasswordValid) {
      const payload: ApiError = {
        code: "NOT_FOUND",
        message: "Le mot de passe est incorrect",
      };
      res.status(404).json(payload);
      return;
    }

    const token = generateSessionToken();

    const userAgent = req.get("User-Agent") ?? "";
    const deviceInfo = new DeviceDetector().parse(
      userAgent,
    ) as DeviceParseResult;

    await Session.create({
      userID: userRaw.userID,
      token,
      expiration: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      device: deviceInfo.device?.type ?? null,
      browser: deviceInfo.client?.name ?? null,
    });

    res.cookie("bande_de_rolistes", token, {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    const payload: LoginSuccess = { token };
    res.json(payload);
  } catch (error) {
    console.error(error);

    const message = error instanceof Error ? error.message : "Erreur inconnue";
    const payload: ApiError = { code: "ERROR", message };
    res.status(500).json(payload);
  }
};

export default controllerLogin;
