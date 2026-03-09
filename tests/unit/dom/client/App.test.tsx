import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api/authApi", () => ({
  apiSession: vi.fn(),
}));

vi.mock("@/api/securityApi", () => ({
  fetchCsrfToken: vi.fn(),
}));

vi.mock("@/client/components/Navbar", () => ({
  default: ({
    onChangeView,
    onLogout,
  }: {
    onChangeView: (
      view:
        | "home"
        | "login"
        | "signup"
        | "admin"
        | "account"
        | "rpg"
        | "rpg-create"
        | "rpg-edit"
        | "quotes",
    ) => void;
    onLogout: () => void;
  }) => (
    <div>
      <button onClick={() => onChangeView("login")}>go-login</button>
      <button onClick={() => onChangeView("signup")}>go-signup</button>
      <button onClick={() => onChangeView("admin")}>go-admin</button>
      <button onClick={() => onChangeView("account")}>go-account</button>
      <button onClick={() => onChangeView("rpg")}>go-rpg</button>
      <button onClick={() => onChangeView("quotes")}>go-quotes</button>
      <button onClick={onLogout}>do-logout</button>
    </div>
  ),
}));

vi.mock("@/client/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/client/components/AuthForms", () => ({
  default: ({
    view,
    onLoginSuccess,
  }: {
    view: string;
    onLoginSuccess: (session: {
      userID: number;
      nickname: string;
      roleID: number;
      role: string;
      isVerified: boolean;
    }) => void;
  }) => (
    <div>
      <span>AuthForms-{view}</span>
      <button
        onClick={() =>
          onLoginSuccess({
            userID: 8,
            nickname: "Neo",
            roleID: 1,
            role: "admin",
            isVerified: true,
          })
        }
      >
        auth-success
      </button>
    </div>
  ),
}));

vi.mock("@/client/views/HomeView", () => ({
  default: () => <div>HomeView</div>,
}));

vi.mock("@/client/views/AdminView", () => ({
  default: ({ onBackHome }: { onBackHome: () => void }) => (
    <div>
      <span>AdminView</span>
      <button onClick={onBackHome}>admin-back</button>
    </div>
  ),
}));

vi.mock("@/client/views/RpgTablesView", () => ({
  default: ({
    onCreateTable,
    onEditTable,
    onLogin,
  }: {
    onCreateTable: () => void;
    onEditTable: (eventID: number) => void;
    onLogin: () => void;
  }) => (
    <div>
      <span>RpgTablesView</span>
      <button onClick={onCreateTable}>rpg-create</button>
      <button onClick={() => onEditTable(42)}>rpg-edit</button>
      <button onClick={onLogin}>rpg-login</button>
    </div>
  ),
}));

vi.mock("@/client/views/AccountView", () => ({
  default: ({
    onSessionRefresh,
    onBackHome,
  }: {
    onSessionRefresh: (session: {
      userID: number;
      nickname: string;
      roleID: number;
      role: string;
      isVerified: boolean;
    }) => void;
    onBackHome: () => void;
  }) => (
    <div>
      <span>AccountView</span>
      <button onClick={onBackHome}>account-back</button>
      <button
        onClick={() =>
          onSessionRefresh({
            userID: 9,
            nickname: "Trinity",
            roleID: 2,
            role: "organisator",
            isVerified: true,
          })
        }
      >
        refresh-session
      </button>
    </div>
  ),
}));

vi.mock("@/client/views/ForbiddenView", () => ({
  default: ({
    title,
    onBackHome,
  }: {
    title: string;
    message: string;
    onBackHome: () => void;
  }) => (
    <div>
      <span>{title}</span>
      <button onClick={onBackHome}>forbidden-back</button>
    </div>
  ),
}));

vi.mock("@/client/views/rpg/UpsertRpgTableView", () => ({
  default: ({ eventID, onBack }: { eventID?: number; onBack: () => void }) => (
    <div>
      <span>{eventID ? `Upsert-${eventID}` : "Upsert-create"}</span>
      <button onClick={onBack}>upsert-back</button>
    </div>
  ),
}));

vi.mock("@/client/views/QuoteView", () => ({
  default: ({ onBackHome }: { onBackHome: () => void }) => (
    <div>
      <span>QuotesView</span>
      <button onClick={onBackHome}>quotes-back</button>
    </div>
  ),
}));

import App from "@/client/App";
import { apiSession } from "@/api/authApi";
import { fetchCsrfToken } from "@/api/securityApi";

describe("App", () => {
  afterEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, "", "/");
  });

  it("checks the session, clears the discord error query, and shows the home view", async () => {
    vi.mocked(apiSession).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    window.history.replaceState({}, "", "/?error=discord");

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });
    expect(errorSpy).toHaveBeenCalledWith("Erreur Discord OAuth:", "discord");
    expect(window.location.search).toBe("");
  });

  it("shows the login form when the session check fails and allows navigation", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-login"));
    expect(screen.getByText("AuthForms-login")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-signup"));
    expect(screen.getByText("AuthForms-signup")).toBeInTheDocument();

    fireEvent.click(screen.getByText("auth-success"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-rpg"));
    expect(screen.getByText("RpgTablesView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("rpg-create"));
    expect(screen.getByText("Upsert-create")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-rpg"));
    fireEvent.click(screen.getByText("rpg-edit"));
    expect(screen.getByText("Upsert-42")).toBeInTheDocument();
    fireEvent.click(screen.getByText("upsert-back"));
    expect(screen.getByText("RpgTablesView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-rpg"));
    fireEvent.click(screen.getByText("rpg-login"));
    expect(screen.getByText("AuthForms-login")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-admin"));
    expect(screen.getByText("AdminView")).toBeInTheDocument();
    fireEvent.click(screen.getByText("admin-back"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-quotes"));
    expect(screen.getByText("QuotesView")).toBeInTheDocument();
    fireEvent.click(screen.getByText("quotes-back"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("go-rpg"));
    fireEvent.click(screen.getByText("rpg-create"));
    fireEvent.click(screen.getByText("upsert-back"));
    expect(screen.getByText("RpgTablesView")).toBeInTheDocument();
  });

  it("renders the forbidden account view without a session", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-account"));

    expect(screen.getByText("Connexion requise")).toBeInTheDocument();
    fireEvent.click(screen.getByText("forbidden-back"));
    expect(screen.getByText("AuthForms-login")).toBeInTheDocument();
  });

  it("renders the account view with a session and logs out even when the request fails", async () => {
    vi.mocked(apiSession).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });
    vi.mocked(fetchCsrfToken).mockRejectedValue(new Error("csrf failed"));
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-account"));
    expect(screen.getByText("AccountView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("refresh-session"));
    fireEvent.click(screen.getByText("do-logout"));

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });
    expect(errorSpy).toHaveBeenCalled();
  });

  it("logs out successfully and returns from the account view", async () => {
    vi.mocked(apiSession).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });
    vi.mocked(fetchCsrfToken).mockResolvedValue("csrf-1");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-account"));
    expect(screen.getByText("AccountView")).toBeInTheDocument();
    fireEvent.click(screen.getByText("account-back"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("do-logout"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/logout", {
        method: "POST",
        headers: { "x-csrf-token": "csrf-1" },
        credentials: "include",
      });
    });
    expect(screen.getByText("HomeView")).toBeInTheDocument();
  });
});
