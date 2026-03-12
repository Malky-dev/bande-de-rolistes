import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import QuoteView from "@/client/views/QuoteView";

vi.mock("@/client/components/QuotesPanel", () => ({
  default: () => <div>QuotesPanel</div>,
}));

vi.mock("@/client/views/ForbiddenView", () => ({
  default: ({
    title,
    message,
  }: {
    title: string;
    message: string;
    onBackHome: () => void;
  }) => (
    <div>
      <span>{title}</span>
      <span>{message}</span>
    </div>
  ),
}));

describe("QuoteView", () => {
  it("affiche la vue interdite de connexion requise quand aucune session n’est présente", () => {
    render(<QuoteView session={null} onBackHome={vi.fn()} />);

    expect(screen.getByText("Connexion requise")).toBeInTheDocument();
    expect(
      screen.getByText(/Vous devez être connecté pour gérer les citations/i),
    ).toBeInTheDocument();
  });

  it("affiche la vue interdite quand le rôle ne peut pas gérer les citations", () => {
    render(
      <QuoteView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 5,
          role: "member",
          isVerified: true,
        }}
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("Accès interdit")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Seuls les admins et organisateurs peuvent gérer les citations/i,
      ),
    ).toBeInTheDocument();
  });

  it("affiche le panneau des citations pour les sessions admin et organisateur", () => {
    const { rerender } = render(
      <QuoteView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 1,
          role: "admin",
          isVerified: true,
        }}
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("QuotesPanel")).toBeInTheDocument();

    rerender(
      <QuoteView
        session={{
          userID: 1,
          nickname: "Neo",
          roleID: 2,
          role: "organisator",
          isVerified: true,
        }}
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("QuotesPanel")).toBeInTheDocument();
  });
});
