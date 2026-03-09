import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Navbar from "@/client/components/Navbar";

vi.mock("@/assets/img/LogoBDR_creme-removebg.png", () => ({
  default: "logo.png",
}));

describe("Navbar", () => {
  it("renders guest actions when no session is present", () => {
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

    fireEvent.click(screen.getByText("Bande de R\u00f4listes"));
    fireEvent.click(screen.getByRole("button", { name: "Connexion" }));
    fireEvent.click(screen.getByRole("button", { name: "Inscription" }));

    expect(onChangeView).toHaveBeenNthCalledWith(1, "home");
    expect(onChangeView).toHaveBeenNthCalledWith(2, "login");
    expect(onChangeView).toHaveBeenNthCalledWith(3, "signup");
  });

  it("renders session actions for admin users", () => {
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
    fireEvent.click(
      screen.getByRole("button", { name: "Privil\u00e8ges Admin" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Mon compte - Neo/i }));
    fireEvent.click(screen.getByRole("button", { name: "D\u00e9connexion" }));

    expect(onChangeView).toHaveBeenCalledWith("quotes");
    expect(onChangeView).toHaveBeenCalledWith("admin");
    expect(onChangeView).toHaveBeenCalledWith("account");
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("renders the quotes shortcut for organisator users", () => {
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
      screen.queryByRole("button", { name: /Privil\u00e8ges Admin/i }),
    ).toBeNull();
  });

  it("marks the rpg view as active and hides guest actions while checking the session", () => {
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

  it("marks signup and account views as active", () => {
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

  it("marks the login view as active and keeps static links visible", () => {
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
