import { afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import App from "@/client/App";
import { apiSession } from "@/api/authApi";

vi.mock("@/api/authApi", () => ({
  apiSession: vi.fn(),
}));

vi.mock("@/api/securityApi", () => ({
  fetchCsrfToken: vi.fn(),
}));

vi.mock("@/client/components/Navbar", () => ({
  default: ({
    onChangeView,
  }: {
    onChangeView: (
      view:
        | "home"
        | "login"
        | "signup"
        | "admin"
        | "account"
        | "rpg"
        | "polls"
        | "quotes"
        | "about"
        | "what-is-rpg"
        | "location"
        | "rules",
    ) => void;
  }) => (
    <div>
      <button onClick={() => onChangeView("home")}>go-home</button>
      <button onClick={() => onChangeView("polls")}>go-polls</button>
    </div>
  ),
}));

vi.mock("@/client/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/client/components/AuthForms", () => ({
  default: ({ view }: { view: string }) => <div>{`AuthForms-${view}`}</div>,
}));

vi.mock("@/client/views/HomeView", () => ({
  default: () => <div>HomeView</div>,
}));

vi.mock("@/client/views/PollsView", () => ({
  default: ({
    reloadToken,
    onCreatePoll,
    onEditPoll,
    onLogin,
  }: {
    reloadToken?: number;
    onCreatePoll: () => void;
    onEditPoll: (pollID: number) => void;
    onLogin: () => void;
  }) => (
    <div>
      <span>{`PollsView-${reloadToken ?? 0}`}</span>
      <button onClick={onCreatePoll}>poll-create</button>
      <button onClick={() => onEditPoll(77)}>poll-edit</button>
      <button onClick={onLogin}>poll-login</button>
    </div>
  ),
}));

vi.mock("@/client/views/polls/UpsertPollView", () => ({
  default: ({
    pollID,
    onBack,
    onDone,
  }: {
    pollID?: number | null;
    onBack: () => void;
    onDone: () => void;
  }) => (
    <div>
      <span>
        {pollID === null ? "PollUpsert-create" : `PollUpsert-${pollID}`}
      </span>
      <button onClick={onBack}>poll-upsert-back</button>
      <button onClick={onDone}>poll-upsert-done</button>
    </div>
  ),
}));

vi.mock("@/client/views/AdminView", () => ({
  default: () => <div>AdminView</div>,
}));
vi.mock("@/client/views/RpgTablesView", () => ({
  default: () => <div>RpgTablesView</div>,
}));
vi.mock("@/client/views/AccountView", () => ({
  default: () => <div>AccountView</div>,
}));
vi.mock("@/client/views/ForbiddenView", () => ({
  default: () => <div>ForbiddenView</div>,
}));
vi.mock("@/client/views/rpg/UpsertRpgTableView", () => ({
  default: () => <div>UpsertRpgTableView</div>,
}));
vi.mock("@/client/views/QuoteView", () => ({
  default: () => <div>QuoteView</div>,
}));
vi.mock("@/client/views/WhatIsRpgView", () => ({
  default: () => <div>WhatIsRpgView</div>,
}));
vi.mock("@/client/views/AboutView", () => ({
  default: () => <div>AboutView</div>,
}));
vi.mock("@/client/views/LocationView", () => ({
  default: () => <div>LocationView</div>,
}));
vi.mock("@/client/views/RuleView", () => ({
  default: () => <div>RuleView</div>,
}));

describe("App - polls modal flow", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    window.history.replaceState({}, "", "/");
  });

  it("ouvre la modale de création de sondage puis la ferme via l’overlay", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-polls"));
    expect(screen.getByText("PollsView-0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("poll-create"));
    expect(screen.getByText("PollUpsert-create")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("poll-modal-overlay"));

    await waitFor(() => {
      expect(screen.queryByText("PollUpsert-create")).not.toBeInTheDocument();
    });
  });

  it("ouvre la modale d’édition de sondage et ne la ferme pas quand on clique dans le contenu", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-polls"));
    fireEvent.click(screen.getByText("poll-edit"));

    expect(screen.getByText("PollUpsert-77")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("poll-modal-content"));

    expect(screen.getByText("PollUpsert-77")).toBeInTheDocument();
  });

  it("incrémente le reload token polls quand la modale est validée", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-polls"));
    expect(screen.getByText("PollsView-0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("poll-create"));
    expect(screen.getByText("PollUpsert-create")).toBeInTheDocument();

    fireEvent.click(screen.getByText("poll-upsert-done"));

    await waitFor(() => {
      expect(screen.getByText("PollsView-1")).toBeInTheDocument();
    });
  });

  it("bascule vers la connexion quand PollsView demande onLogin", async () => {
    vi.mocked(apiSession).mockRejectedValue(new Error("no session"));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText("HomeView")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("go-polls"));
    expect(screen.getByText("PollsView-0")).toBeInTheDocument();

    fireEvent.click(screen.getByText("poll-login"));

    expect(screen.getByText("AuthForms-login")).toBeInTheDocument();
  });
});
