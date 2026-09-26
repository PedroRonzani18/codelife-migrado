import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IslandCatalogView } from "./IslandCatalogView";
import * as learningService from "../services/learningService";
import type { IslandCatalog } from "@codelife/contracts/learning";
import { ApiClientError } from "@/shared/http";

vi.mock("../services/learningService", () => ({
  getIslandCatalog: vi.fn(),
  getIsland: vi.fn(),
  getLevel: vi.fn(),
  getMediaUrl: vi.fn(),
}));

function renderView() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/ilhas"]}>
        <IslandCatalogView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("IslandCatalogView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(cleanup);

  it("shows loading state while fetching islands catalog", () => {
    vi.mocked(learningService.getIslandCatalog).mockReturnValue(new Promise(() => {}));

    renderView();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando catálogo de ilhas…");
  });

  it("shows error state with retry option on failure", async () => {
    vi.mocked(learningService.getIslandCatalog).mockRejectedValue(
      new ApiClientError(500, "INTERNAL_ERROR", "Falha de conexão")
    );

    renderView();

    expect(await screen.findByText("Não foi possível carregar as ilhas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tentar novamente" })).toBeInTheDocument();
  });

  it("shows empty state when no islands are published", async () => {
    vi.mocked(learningService.getIslandCatalog).mockResolvedValue([]);

    renderView();

    expect(await screen.findByRole("heading", { name: "Nenhuma ilha publicada" })).toBeInTheDocument();
  });

  it("renders published islands in order with correct actions", async () => {
    const mockCatalog: IslandCatalog = [
      {
        id: "00000000-0000-4000-8000-000000000001",
        slug: "island-1",
        title: "Primeira Ilha",
        position: 1,
        levelCount: 2,
        availability: "available",
      },
      {
        id: "00000000-0000-4000-8000-000000000002",
        slug: "island-2",
        title: "Segunda Ilha",
        position: 2,
        levelCount: 3,
        availability: "blocked",
      },
    ];

    vi.mocked(learningService.getIslandCatalog).mockResolvedValue(mockCatalog);

    renderView();

    expect(await screen.findByRole("heading", { name: "Ilhas de Aprendizado" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Primeira Ilha" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Segunda Ilha" })).toBeInTheDocument();

    const startBtn = screen.getByRole("link", { name: /Começar ilha/i });
    expect(startBtn).toHaveAttribute("href", "/ilhas/island-1");

    const blockedBtn = screen.getByRole("button", { name: /Ilha Bloqueada/i });
    expect(blockedBtn).toBeDisabled();
  });
});
