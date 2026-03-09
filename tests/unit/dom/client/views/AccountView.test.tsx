import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/authApi", () => ({
  apiSession: vi.fn(),
}));

vi.mock("@/api/accountApi", () => ({
  apiGetAccount: vi.fn(),
  apiUpdateAccount: vi.fn(),
}));

import AccountView from "@/client/views/AccountView";
import { apiSession } from "@/api/authApi";
import { apiGetAccount, apiUpdateAccount } from "@/api/accountApi";

describe("AccountView", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("loads and renders the account", async () => {
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

  it("shows the loading error when the account cannot be loaded", async () => {
    vi.mocked(apiGetAccount).mockRejectedValue(new Error("Load failed"));

    render(<AccountView onBackHome={vi.fn()} onSessionRefresh={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Load failed")).toBeInTheDocument();
    });
  });

  it("saves the nickname, refreshes the session, and supports back navigation", async () => {
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
      expect(screen.getByText("Infos mises \u00e0 jour.")).toBeInTheDocument();
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

  it("shows the save error when the update fails", async () => {
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

  it("shows fallback messages for non-Error load and save failures", async () => {
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
