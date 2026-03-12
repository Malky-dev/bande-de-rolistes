import { beforeEach, describe, expect, it, vi } from "vitest";

import { makeReq } from "@/../tests/helpers/express";

type LoadOpts = {
  existingUser?: any;
  hashResult?: string;
  findOneError?: any;
  createError?: any;
};

const makeRes = () => ({
  status: vi.fn().mockReturnThis(),
  json: vi.fn().mockReturnThis(),
});

async function load(opts: LoadOpts = {}) {
  vi.resetModules();
  vi.clearAllMocks();

  const hashPassword = vi.fn();
  const User = { findOne: vi.fn(), create: vi.fn() };

  if (opts.findOneError !== undefined) {
    if (opts.findOneError instanceof Error)
      User.findOne.mockRejectedValue(opts.findOneError);
    else
      User.findOne.mockImplementation(() => {
        throw opts.findOneError;
      });
  } else {
    User.findOne.mockResolvedValue(opts.existingUser ?? null);
  }

  if (opts.createError !== undefined) {
    if (opts.createError instanceof Error)
      User.create.mockRejectedValue(opts.createError);
    else
      User.create.mockImplementation(() => {
        throw opts.createError;
      });
  } else {
    User.create.mockResolvedValue(undefined);
  }

  hashPassword.mockResolvedValue(opts.hashResult ?? "hashed");

  vi.doMock("@/server/global", () => ({ hashPassword }));
  vi.doMock("@/server/models", () => ({ User }));
  vi.doMock("@/server/models/index", () => ({ User }));

  const { default: controllerSignin } =
    await import("@/server/controllers/signin");

  return { controllerSignin, mocks: { hashPassword, User } };
}

describe("controller signin", () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  it("retourne 400 si nickname n’est pas une chaîne", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: 123,
        email: "a@b.c",
        password: "a".repeat(12),
        passwordCheck: "a".repeat(12),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le pseudo doit être une chaîne de caractères",
    });
  });

  it("retourne 400 si email n’est pas une chaîne", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: 123,
        password: "a".repeat(12),
        passwordCheck: "a".repeat(12),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "L'email doit être une chaîne de caractères",
    });
  });

  it("retourne 400 si password n’est pas une chaîne", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "a@b.c",
        password: 123,
        passwordCheck: "a".repeat(12),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le mot de passe doit être une chaîne de caractères",
    });
  });

  it("retourne 400 si passwordCheck n’est pas une chaîne", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "a@b.c",
        password: "a".repeat(12),
        passwordCheck: 123,
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message:
        "La confirmation du mot de passe doit être une chaîne de caractères",
    });
  });

  it("retourne 400 si les mots de passe ne correspondent pas", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "a@b.c",
        password: "a".repeat(12),
        passwordCheck: "b".repeat(12),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Les mots de passe ne correspondent pas",
    });
  });

  it("retourne 400 si l’email est invalide", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "not-an-email",
        password: "a".repeat(12),
        passwordCheck: "a".repeat(12),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "L'email n'est pas valide",
    });
  });

  it("retourne 400 si le mot de passe est trop court", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "a@b.c",
        password: "a".repeat(11),
        passwordCheck: "a".repeat(11),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le mot de passe doit contenir au moins 12 caractères",
    });
  });

  it("retourne 400 si le mot de passe est trop long", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "a@b.c",
        password: "a".repeat(129),
        passwordCheck: "a".repeat(129),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le mot de passe est trop long",
    });
  });

  it("retourne 400 si le mot de passe est identique à l’email normalisé", async () => {
    const { controllerSignin } = await load();
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "  Test@Example.com  ",
        password: "test@example.com",
        passwordCheck: "test@example.com",
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Le mot de passe ne peut pas être identique à l'email",
    });
  });

  it("retourne 400 si le mot de passe est trop simple avec des caractères répétés", async () => {
    const { controllerSignin } = await load();
    const pw = "a".repeat(12);
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "a@b.c",
        password: pw,
        passwordCheck: pw,
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "BAD_REQUEST",
      message: "Mot de passe trop simple",
    });
  });

  it("retourne 409 si l’utilisateur existe déjà", async () => {
    const { controllerSignin, mocks } = await load({
      existingUser: { userID: 1 },
    });
    const req = makeReq({
      body: {
        nickname: "nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(mocks.User.findOne).toHaveBeenCalledWith({
      where: { email: "a@b.c" },
    });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      code: "DUPLICATE",
      message: "L'utilisateur existe déjà",
    });
  });

  it("retourne 201 en créant l’utilisateur avec l’email normalisé et le rôle guest", async () => {
    const { controllerSignin, mocks } = await load({ hashResult: "h" });

    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "  A@B.C  ",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(mocks.hashPassword).toHaveBeenCalledWith("abc" + "1".repeat(9));
    expect(mocks.User.create).toHaveBeenCalledWith({
      nickname: "Nick",
      email: "a@b.c",
      password: "h",
      roleID: 5,
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      code: "SUCCESS",
      message: "L'utilisateur a été créé avec succès",
    });
  });

  it("retourne 400 en cas de SequelizeValidationError avec concaténation des messages", async () => {
    const err: any = new Error("nope");
    err.name = "SequelizeValidationError";
    err.errors = [{ message: "m1" }, { message: "m2" }];

    const { controllerSignin } = await load({ createError: err });

    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "VALIDATION_ERROR",
      message: "m1, m2",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("retourne 400 en cas de SequelizeValidationError avec le message de repli 'Validation error' si aucun détail exploitable n’est présent", async () => {
    const err: any = new Error("nope");
    err.name = "SequelizeValidationError";
    err.errors = [{ message: undefined }, { message: 123 }];

    const { controllerSignin } = await load({ createError: err });

    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "VALIDATION_ERROR",
      message: "Validation error",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("retourne 400 en cas de SequelizeValidationError avec le message de repli 'Validation error' si errors est absent", async () => {
    const err: any = new Error("nope");
    err.name = "SequelizeValidationError";

    const { controllerSignin } = await load({ createError: err });

    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "VALIDATION_ERROR",
      message: "Validation error",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("retourne 409 en cas de SequelizeUniqueConstraintError", async () => {
    const err: any = new Error("uniq");
    err.name = "SequelizeUniqueConstraintError";

    const { controllerSignin } = await load({ createError: err });
    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      code: "DUPLICATE",
      message: "Cet email ou ce pseudo est déjà utilisé",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("retourne 400 en cas de SequelizeForeignKeyConstraintError", async () => {
    const err: any = new Error("fk");
    err.name = "SequelizeForeignKeyConstraintError";

    const { controllerSignin } = await load({ createError: err });
    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      code: "FOREIGN_KEY_ERROR",
      message:
        "Le rôle spécifié n'existe pas. Veuillez contacter l'administrateur.",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("retourne 500 avec le message de repli 'Erreur serveur' si une Error a un message vide", async () => {
    const err = new Error("");
    const { controllerSignin } = await load({ createError: err });

    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("retourne 500 si une exception non-Error est levée", async () => {
    const { controllerSignin } = await load({ createError: "nope" });
    const req = makeReq({
      body: {
        nickname: "Nick",
        email: "a@b.c",
        password: "abc" + "1".repeat(9),
        passwordCheck: "abc" + "1".repeat(9),
      },
    });
    const res = makeRes();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await controllerSignin(req as any, res as any, vi.fn() as any);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      code: "ERROR",
      message: "Erreur serveur",
    });
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
