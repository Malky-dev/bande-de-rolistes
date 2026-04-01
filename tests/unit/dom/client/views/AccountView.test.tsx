import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import AccountView from "@/client/views/AccountView";

import { apiSession } from "@/api/auth";
import { apiGetAccount, apiUpdateAccount } from "@/api/account";

vi.mock("@/api/auth", () => ({
  apiSession: vi.fn(),
}));

vi.mock("@/api/account", () => ({
  apiGetAccount: vi.fn(),
  apiUpdateAccount: vi.fn(),
}));

describe("AccountView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("charge et affiche le compte", async () => {
    vi.mocked(apiGetAccount).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: "discord-1",
    });

    render(<AccountView onBackHome={vi.fn()} onSessionRefresh={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("neo@matrix.tld")).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("Neo")).toBeInTheDocument();
    expect(screen.getByText(/Inscrit via Discord : Oui/i)).toBeInTheDocument();
  });

  it("affiche l’erreur de chargement quand le compte ne peut pas être chargé", async () => {
    vi.mocked(apiGetAccount).mockRejectedValue(new Error("Load failed"));

    render(<AccountView onBackHome={vi.fn()} onSessionRefresh={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Load failed")).toBeInTheDocument();
    });
  });

  it("enregistre le pseudo, rafraîchit la session et permet de revenir en arrière", async () => {
    const onBackHome = vi.fn();
    const onSessionRefresh = vi.fn();
    vi.mocked(apiGetAccount).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: null,
    });
    vi.mocked(apiUpdateAccount).mockResolvedValue({
      userID: 1,
      nickname: "Trinity",
      email: "neo@matrix.tld",
      discordId: null,
    });
    vi.mocked(apiSession).mockResolvedValue({
      userID: 1,
      nickname: "Trinity",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });

    const { container } = render(
      <AccountView
        onBackHome={onBackHome}
        onSessionRefresh={onSessionRefresh}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue("Neo")).toBeInTheDocument();
    });

    const inputs = container.querySelectorAll("input");

    fireEvent.change(inputs[1], {
      target: { value: "Trinity" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Infos mises à jour.")).toBeInTheDocument();
    });
    expect(apiUpdateAccount).toHaveBeenCalledWith({ nickname: "Trinity" });
    expect(onSessionRefresh).toHaveBeenCalledWith({
      userID: 1,
      nickname: "Trinity",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });

    fireEvent.click(screen.getByRole("button", { name: "Retour" }));
    expect(onBackHome).toHaveBeenCalledTimes(1);
  });

  it("affiche l’erreur d’enregistrement quand la mise à jour échoue", async () => {
    vi.mocked(apiGetAccount).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: null,
    });
    vi.mocked(apiUpdateAccount).mockRejectedValue(new Error("Save failed"));

    render(<AccountView onBackHome={vi.fn()} onSessionRefresh={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Neo")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Save failed")).toBeInTheDocument();
    });
  });

  it("affiche les messages de secours pour les échecs de chargement et d’enregistrement non Error", async () => {
    vi.mocked(apiGetAccount).mockRejectedValueOnce("boom");

    const firstRender = render(
      <AccountView onBackHome={vi.fn()} onSessionRefresh={vi.fn()} />,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Impossible de charger votre compte"),
      ).toBeInTheDocument();
    });

    firstRender.unmount();

    vi.mocked(apiGetAccount).mockResolvedValueOnce({
      userID: 1,
      nickname: "Neo",
      email: "neo@matrix.tld",
      discordId: null,
    });
    vi.mocked(apiUpdateAccount).mockRejectedValueOnce("boom");

    render(<AccountView onBackHome={vi.fn()} onSessionRefresh={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue("Neo")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(screen.getByText("Impossible de sauvegarder")).toBeInTheDocument();
    });
  });
});
