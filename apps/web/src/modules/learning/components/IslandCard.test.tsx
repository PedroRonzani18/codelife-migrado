import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";
import { IslandCard } from "./IslandCard";
import type { IslandCatalogItem } from "@codelife/contracts/learning";

function renderCard(island: IslandCatalogItem) {
  return render(
    <MemoryRouter>
      <IslandCard island={island} />
    </MemoryRouter>
  );
}

describe("IslandCard", () => {
  afterEach(cleanup);

  it("renders available island with start button", () => {
    renderCard({
      id: "00000000-0000-4000-8000-000000000001",
      slug: "fundamentos-html",
      title: "Fundamentos de HTML",
      position: 1,
      levelCount: 3,
      availability: "available",
    });

    expect(screen.getByRole("heading", { name: "Fundamentos de HTML" })).toBeInTheDocument();
    expect(screen.getByText("Ilha 1")).toBeInTheDocument();
    expect(screen.getByText("3 níveis de aprendizado")).toBeInTheDocument();
    expect(screen.getByText("Disponível")).toBeInTheDocument();

    const startLink = screen.getByRole("link", { name: /Começar ilha/i });
    expect(startLink).toHaveAttribute("href", "/ilhas/fundamentos-html");
  });

  it("renders in_progress island with continue button", () => {
    renderCard({
      id: "00000000-0000-4000-8000-000000000002",
      slug: "javascript-basico",
      title: "JavaScript Básico",
      position: 2,
      levelCount: 1,
      availability: "in_progress",
    });

    expect(screen.getByRole("heading", { name: "JavaScript Básico" })).toBeInTheDocument();
    expect(screen.getByText("1 nível de aprendizado")).toBeInTheDocument();
    expect(screen.getByText("Em andamento")).toBeInTheDocument();

    const continueLink = screen.getByRole("link", { name: /Continuar ilha/i });
    expect(continueLink).toHaveAttribute("href", "/ilhas/javascript-basico");
  });

  it("renders completed island with revisit button", () => {
    renderCard({
      id: "00000000-0000-4000-8000-000000000003",
      slug: "css-layout",
      title: "CSS e Layouts",
      position: 3,
      levelCount: 4,
      availability: "completed",
    });

    expect(screen.getByText("Concluída")).toBeInTheDocument();

    const revisitLink = screen.getByRole("link", { name: /Revisitar ilha/i });
    expect(revisitLink).toHaveAttribute("href", "/ilhas/css-layout");
  });

  it("renders blocked island with disabled button and explanation text", () => {
    renderCard({
      id: "00000000-0000-4000-8000-000000000004",
      slug: "react-avancado",
      title: "React Avançado",
      position: 4,
      levelCount: 5,
      availability: "blocked",
    });

    expect(screen.getByText("Bloqueada")).toBeInTheDocument();
    expect(screen.getByText("Conclua a ilha anterior para desbloquear esta etapa da jornada.")).toBeInTheDocument();

    const disabledBtn = screen.getByRole("button", { name: /Ilha Bloqueada/i });
    expect(disabledBtn).toBeDisabled();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
