import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ForbiddenView from "@/client/views/ForbiddenView";

describe("ForbiddenView", () => {
  it("affiche le message par défaut et appelle onBackHome", () => {
    const onBackHome = vi.fn();

    render(<ForbiddenView onBackHome={onBackHome} />);

    expect(screen.getByText("Accès refusé")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Vous devez être administrateur pour accéder à cette page.",
      ),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /retour/i }));

    expect(onBackHome).toHaveBeenCalledTimes(1);
  });

  it("affiche un titre et un message personnalisés", () => {
    render(
      <ForbiddenView
        title="Connexion requise"
        message="Veuillez vous connecter."
        onBackHome={vi.fn()}
      />,
    );

    expect(screen.getByText("Connexion requise")).toBeInTheDocument();
    expect(screen.getByText("Veuillez vous connecter.")).toBeInTheDocument();
  });
});
