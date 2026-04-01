import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/auth", () => ({
  apiLogin: vi.fn(),
  apiSession: vi.fn(),
  apiSignin: vi.fn(),
}));

import AuthForms from "@/client/components/AuthForms";
import { apiLogin, apiSession, apiSignin } from "@/api/auth";

describe("AuthForms", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("affiche le parcours de connexion et appelle onLoginSuccess", async () => {
    const onLoginSuccess = vi.fn();
    vi.mocked(apiLogin).mockResolvedValue();
    vi.mocked(apiSession).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });

    const { container } = render(
      <AuthForms
        view="login"
        onSwitchView={vi.fn()}
        onLoginSuccess={onLoginSuccess}
      />,
    );

    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], {
      target: { value: "neo@matrix.tld" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "Password12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalledWith({
        userID: 1,
        nickname: "Neo",
        roleID: 1,
        role: "admin",
        isVerified: true,
      });
    });
    expect(apiLogin).toHaveBeenCalledWith("neo@matrix.tld", "Password12345");
  });

  it("bloque l’inscription quand les mots de passe ne correspondent pas", async () => {
    const { container } = render(
      <AuthForms
        view="signup"
        onSwitchView={vi.fn()}
        onLoginSuccess={vi.fn()}
      />,
    );

    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], {
      target: { value: "Neo" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "neo@matrix.tld" },
    });
    fireEvent.change(inputs[2], {
      target: { value: "Password12345" },
    });
    fireEvent.change(inputs[3], {
      target: { value: "Password54321" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));

    expect(
      screen.getByText("Les mots de passe ne correspondent pas"),
    ).toBeInTheDocument();
    expect(apiSignin).not.toHaveBeenCalled();
  });

  it("enchaîne l’inscription puis la connexion", async () => {
    const onLoginSuccess = vi.fn();
    vi.mocked(apiSignin).mockResolvedValue();
    vi.mocked(apiLogin).mockResolvedValue();
    vi.mocked(apiSession).mockResolvedValue({
      userID: 2,
      nickname: "Trinity",
      roleID: 2,
      role: "organisator",
      isVerified: true,
    });

    const { container } = render(
      <AuthForms
        view="signup"
        onSwitchView={vi.fn()}
        onLoginSuccess={onLoginSuccess}
      />,
    );

    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], {
      target: { value: "Trinity" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "trinity@matrix.tld" },
    });
    fireEvent.change(inputs[2], {
      target: { value: "Password12345" },
    });
    fireEvent.change(inputs[3], {
      target: { value: "Password12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));

    await waitFor(() => {
      expect(onLoginSuccess).toHaveBeenCalled();
    });
    expect(apiSignin).toHaveBeenCalledWith(
      "Trinity",
      "trinity@matrix.tld",
      "Password12345",
      "Password12345",
    );
    expect(apiLogin).toHaveBeenCalledWith(
      "trinity@matrix.tld",
      "Password12345",
    );
  });

  it("affiche l’erreur de l’API quand la soumission échoue", async () => {
    vi.mocked(apiLogin).mockRejectedValue(new Error("Bad credentials"));

    const { container } = render(
      <AuthForms
        view="login"
        onSwitchView={vi.fn()}
        onLoginSuccess={vi.fn()}
      />,
    );

    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], {
      target: { value: "neo@matrix.tld" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "Password12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Se connecter" }));

    await waitFor(() => {
      expect(screen.getByText("Bad credentials")).toBeInTheDocument();
    });
  });

  it("change de vue et redirige vers Discord", () => {
    const onSwitchView = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { href: "http://localhost/" },
      writable: true,
    });

    render(
      <AuthForms
        view="login"
        onSwitchView={onSwitchView}
        onLoginSuccess={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /S'inscrire/i }));
    fireEvent.click(screen.getByRole("button", { name: /Discord/i }));

    expect(onSwitchView).toHaveBeenCalledWith("signup");
    expect(window.location.href).toBe("/api/discord/init");
  });

  it("revient de l’inscription vers la connexion et affiche l’erreur générique pour un échec non Error", async () => {
    vi.mocked(apiSignin).mockRejectedValue("boom");
    const onSwitchView = vi.fn();
    const { container } = render(
      <AuthForms
        view="signup"
        onSwitchView={onSwitchView}
        onLoginSuccess={vi.fn()}
      />,
    );

    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[0], {
      target: { value: "Neo" },
    });
    fireEvent.change(inputs[1], {
      target: { value: "neo@matrix.tld" },
    });
    fireEvent.change(inputs[2], {
      target: { value: "Password12345" },
    });
    fireEvent.change(inputs[3], {
      target: { value: "Password12345" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Se connecter/i }));
    expect(onSwitchView).toHaveBeenCalledWith("login");

    fireEvent.click(screen.getByRole("button", { name: "Créer mon compte" }));

    await waitFor(() => {
      expect(screen.getByText("Une erreur est survenue")).toBeInTheDocument();
    });
  });
});
