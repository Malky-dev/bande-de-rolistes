import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/client/App";
import { apiSession } from "@/api/authApi";
import { fetchCsrfToken } from "@/api/securityApi";

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
        | "quotes"
        | "about"
        | "what-is-rpg"
        | "location"
        | "rules",
    ) => void;
    onLogout: () => void;
  }) => (
    <div>
      <button onClick={() => onChangeView("home")}>go-home</button>
      <button onClick={() => onChangeView("login")}>go-login</button>
      <button onClick={() => onChangeView("signup")}>go-signup</button>
      <button onClick={() => onChangeView("admin")}>go-admin</button>
      <button onClick={() => onChangeView("account")}>go-account</button>
      <button onClick={() => onChangeView("rpg")}>go-rpg</button>
      <button onClick={() => onChangeView("quotes")}>go-quotes</button>
      <button onClick={() => onChangeView("about")}>go-about</button>
      <button onClick={() => onChangeView("what-is-rpg")}>
        go-what-is-rpg
      </button>
      <button onClick={() => onChangeView("location")}>go-location</button>
      <button onClick={() => onChangeView("rules")}>go-rules</button>
      <button onClick={onLogout}>do-logout</button>
    </div>
  ),
}));

vi.mock("@/client/components/Footer", () => ({
  default: ({ onChangeView }: { onChangeView: (view: string) => void }) => (
    <div>
      <span>Footer</span>
      <button onClick={() => onChangeView("home")}>footer-home</button>
    </div>
  ),
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
      <span>{`AuthForms-${view}`}</span>
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
    reloadToken,
  }: {
    onCreateTable: () => void;
    onEditTable: (eventID: number) => void;
    onLogin: () => void;
    reloadToken?: number;
  }) => (
    <div>
      <span>{`RpgTablesView-${reloadToken ?? 0}`}</span>
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
  default: ({
    eventID,
    onBack,
    onDone,
  }: {
    eventID?: number | null;
    onBack: () => void;
    onDone: () => void;
  }) => (
    <div>
      <span>{eventID ? `Upsert-${eventID}` : "Upsert-create"}</span>
      <button onClick={onBack}>upsert-back</button>
      <button onClick={onDone}>upsert-done</button>
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

vi.mock("@/client/views/AboutView", () => ({
  default: ({ onJoinTable }: { onJoinTable: () => void }) => (
    <div>
      <span>AboutView</span>
      <button onClick={onJoinTable}>about-back</button>
    </div>
  ),
}));

vi.mock("@/client/views/WhatIsRpgView", () => ({
  default: ({ onJoinTable }: { onJoinTable: () => void }) => (
    <div>
      <span>WhatIsRpgView</span>
      <button onClick={onJoinTable}>what-is-rpg-back</button>
    </div>
  ),
}));

vi.mock("@/client/views/LocationView", () => ({
  default: ({ onJoinTable }: { onJoinTable: () => void }) => (
    <div>
      <span>LocationView</span>
      <button onClick={onJoinTable}>location-back</button>
    </div>
  ),
}));

vi.mock("@/client/views/RuleView", () => ({
  default: () => <div>RuleView</div>,
}));

describe("App", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("vérifie la session, nettoie le paramètre d’erreur Discord et affiche l’accueil", async () => {
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

  it("affiche la vue de connexion quand la vérification de session échoue", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-login"));

    expect(screen.getByText("AuthForms-login")).toBeInTheDocument();
  });

  it("affiche la vue d’inscription puis revient à l’accueil après une connexion réussie", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-signup"));
    expect(screen.getByText("AuthForms-signup")).toBeInTheDocument();

    fireEvent.click(screen.getByText("auth-success"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();
  });

  it("affiche la vue interdite sans session puis redirige vers la connexion", async () => {
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

  it("affiche la vue compte avec une session et permet de rafraîchir la session", async () => {
    vi.mocked(apiSession).mockResolvedValue({
      userID: 1,
      nickname: "Neo",
      roleID: 1,
      role: "admin",
      isVerified: true,
    });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-account"));
    expect(screen.getByText("AccountView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("refresh-session"));
    expect(screen.getByText("AccountView")).toBeInTheDocument();
  });

  it("déconnecte avec succès et revient à l’accueil", async () => {
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

  it("déconnecte et revient à l’accueil même si la récupération du token CSRF échoue", async () => {
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

    fireEvent.click(screen.getByText("do-logout"));

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    expect(errorSpy).toHaveBeenCalledWith(
      "Erreur lors de la déconnexion:",
      expect.any(Error),
    );
  });

  it("affiche la vue admin puis revient à l’accueil", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-admin"));
    expect(screen.getByText("AdminView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("admin-back"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();
  });

  it("affiche la vue citations puis revient à l’accueil", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-quotes"));
    expect(screen.getByText("QuotesView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("quotes-back"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();
  });

  it("affiche la vue à propos puis revient à la vue JDR", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-about"));
    expect(screen.getByText("AboutView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("about-back"));
    expect(screen.getByText(/RpgTablesView-/)).toBeInTheDocument();
  });

  it("affiche la vue qu’est-ce qu’un JDR puis revient à la vue JDR", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-what-is-rpg"));
    expect(screen.getByText("WhatIsRpgView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("what-is-rpg-back"));
    expect(screen.getByText(/RpgTablesView-/)).toBeInTheDocument();
  });

  it("affiche la vue lieu puis revient à la vue JDR", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-location"));
    expect(screen.getByText("LocationView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("location-back"));
    expect(screen.getByText(/RpgTablesView-/)).toBeInTheDocument();
  });

  it("affiche la vue des règles", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-rules"));
    expect(screen.getByText("RuleView")).toBeInTheDocument();
  });

  it("ouvre la modale de création JDR puis la ferme avec retour", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-rpg"));
    expect(screen.getByText("RpgTablesView-0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("rpg-create"));
    expect(screen.getByText("Upsert-create")).toBeInTheDocument();

    fireEvent.click(screen.getByText("upsert-back"));
    expect(screen.getByText("RpgTablesView-0")).toBeInTheDocument();
  });

  it("ouvre la modale d’édition JDR avec l’identifiant d’événement sélectionné", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-rpg"));
    fireEvent.click(screen.getByText("rpg-edit"));

    expect(screen.getByText("Upsert-42")).toBeInTheDocument();
  });

  it("ferme la modale JDR quand on clique sur l’overlay", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-rpg"));
    fireEvent.click(screen.getByText("rpg-create"));

    expect(screen.getByText("Upsert-create")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("rpg-modal-overlay"));

    expect(screen.queryByText("Upsert-create")).not.toBeInTheDocument();
  });

  it("ne ferme pas la modale JDR quand on clique dans son contenu", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-rpg"));
    fireEvent.click(screen.getByText("rpg-create"));

    expect(screen.getByText("Upsert-create")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("rpg-modal-content"));

    expect(screen.getByText("Upsert-create")).toBeInTheDocument();
  });

  it("incrémente le reload token JDR quand la modale est validée", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-rpg"));
    expect(screen.getByText("RpgTablesView-0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("rpg-create"));
    expect(screen.getByText("Upsert-create")).toBeInTheDocument();

    fireEvent.click(screen.getByText("upsert-done"));

    await waitFor(() => {
      expect(screen.getByText("RpgTablesView-1")).toBeInTheDocument();
    });
  });

  it("bascule vers la connexion depuis la vue JDR quand elle est demandée", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-rpg"));
    expect(screen.getByText("RpgTablesView-0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("rpg-login"));
    expect(screen.getByText("AuthForms-login")).toBeInTheDocument();
  });

  it("permet de revenir à l’accueil depuis le footer", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-quotes"));
    expect(screen.getByText("QuotesView")).toBeInTheDocument();

    fireEvent.click(screen.getByText("footer-home"));
    expect(screen.getByText("HomeView")).toBeInTheDocument();
  });
});
