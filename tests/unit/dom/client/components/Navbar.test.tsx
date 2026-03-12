import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Navbar from "@/client/components/Navbar";

vi.mock("@/assets/img/LogoBDR_creme-removebg.png", () => ({
  default: "logo.png",
}));

describe("Navbar", () => {
  it("affiche les actions invité quand aucune session n’est présente", () => {
    const onChangeView = vi.fn();

    render(
      <Navbar
        view="home"
        checkingSession={false}
        session={null}
        onChangeView={onChangeView}
        onLogout={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("Bande de Rôlistes"));
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));
    fireEvent.click(screen.getByRole("button", { name: "Inscription" }));

    expect(onChangeView).toHaveBeenNthCalledWith(1, "home");
    expect(onChangeView).toHaveBeenNthCalledWith(2, "login");
    expect(onChangeView).toHaveBeenNthCalledWith(3, "signup");
  });

  it("affiche les actions de session pour un admin", () => {
    const onChangeView = vi.fn();
    const onLogout = vi.fn();

    render(
      <Navbar
        view="admin"
        checkingSession={false}
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onChangeView={onChangeView}
        onLogout={onLogout}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Citations" }));
    fireEvent.click(screen.getByRole("button", { name: "Privilèges Admin" }));
    fireEvent.click(screen.getByRole("button", { name: /Mon compte - Neo/i }));
    fireEvent.click(screen.getByRole("button", { name: "Déconnexion" }));

    expect(onChangeView).toHaveBeenCalledWith("quotes");
    expect(onChangeView).toHaveBeenCalledWith("admin");
    expect(onChangeView).toHaveBeenCalledWith("account");
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("affiche le raccourci vers les citations pour un organisateur", () => {
    render(
      <Navbar
        view="quotes"
        checkingSession={false}
        session={{
          userID: 2,
          nickname: "Trinity",
          roleID: 2,
          role: "organisator",
          isVerified: true,
        }}
        onChangeView={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Citations" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Privilèges Admin/i }),
    ).toBeNull();
  });

  it("marque la vue JDR comme active et masque les actions invité pendant la vérification de session", () => {
    const onChangeView = vi.fn();

    render(
      <Navbar
        view="rpg"
        checkingSession={true}
        session={null}
        onChangeView={onChangeView}
        onLogout={vi.fn()}
      />,
    );

    const rpgButton = screen.getByRole("button", { name: "Tables JDR" });
    const homeButton = screen.getByRole("button", { name: "Accueil" });

    expect(rpgButton.className).toContain("navbar-link-active");
    expect(screen.queryByRole("button", { name: "Connexion" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Inscription" })).toBeNull();

    fireEvent.click(homeButton);
    fireEvent.click(rpgButton);

    expect(onChangeView).toHaveBeenNthCalledWith(1, "home");
    expect(onChangeView).toHaveBeenNthCalledWith(2, "rpg");
  });

  it("marque les vues inscription et compte comme actives", () => {
    const { rerender } = render(
      <Navbar
        view="signup"
        checkingSession={false}
        session={null}
        onChangeView={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Inscription" }).className,
    ).toContain("navbar-link-active");

    rerender(
      <Navbar
        view="account"
        checkingSession={false}
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onChangeView={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: /Mon compte - Neo/i }).className,
    ).toContain("navbar-link-active");
  });

  it("marque la vue connexion comme active et garde les liens statiques visibles", () => {
    render(
      <Navbar
        view="login"
        checkingSession={false}
        session={null}
        onChangeView={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Connexion" }).className,
    ).toContain("navbar-link-active");
    expect(
      screen.getByRole("button", { name: "Qui sommes-nous ?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Le jeu de rôle" }),
    ).toBeInTheDocument();
  });
});
