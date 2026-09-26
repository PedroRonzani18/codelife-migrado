import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IslandView from "./IslandView";
import * as learningService from "../services/learningService";
import * as progressService from "../services/progressService";
import type { IslandDetail } from "@codelife/contracts/learning";
import type { ProgressSnapshot } from "@codelife/contracts/progress";
import { ApiClientError } from "@/shared/http";

vi.mock("../services/learningService", () => ({
  getIsland: vi.fn(),
  getLevel: vi.fn(),
  getMediaUrl: vi.fn(),
}));

vi.mock("../services/progressService", () => ({
  getProgressSnapshot: vi.fn(),
  startLevel: vi.fn(),
  navigateToSlide: vi.fn(),
  completeLevel: vi.fn(),
}));

const mockIsland: IslandDetail = {
  id: "00000000-0000-4000-8000-000000000001",
  slug: "ilha-1",
  title: "Ilha de Teste",
  levelCount: 1,
  availability: "available",
  levels: [
    {
      id: "00000000-0000-4000-8000-000000000101",
      title: "Primeiro Nível",
      position: 1,
      availability: "available",
    },
  ],
};

const mockSnapshot: ProgressSnapshot = {
  lastVisited: null,
  nextRecommended: null,
  islands: [
    {
      id: "00000000-0000-4000-8000-000000000001",
      slug: "ilha-1",
      title: "Ilha de Teste",
      levelCount: 1,
      progress: null,
      levels: [
        {
          id: "00000000-0000-4000-8000-000000000101",
          title: "Primeiro Nível",
          position: 1,
          availability: "available",
          progress: null,
        },
      ],
    },
  ],
};

function renderView(slug = "ilha-1") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/ilhas/${slug}`]}>
        <Routes>
          <Route path="/ilhas/:islandSlug" element={<IslandView />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("IslandView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(cleanup);

  it("renders loading state while fetching island details", () => {
    vi.mocked(learningService.getIsland).mockReturnValue(new Promise(() => {}));
    vi.mocked(progressService.getProgressSnapshot).mockReturnValue(new Promise(() => {}));

    renderView();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando sua jornada…");
  });

  it("handles ISLAND_BLOCKED with friendly error and link back to catalog", async () => {
    vi.mocked(learningService.getIsland).mockRejectedValue(
      new ApiClientError(403, "ISLAND_BLOCKED", "A ilha está bloqueada.")
    );
    vi.mocked(progressService.getProgressSnapshot).mockResolvedValue(mockSnapshot);

    renderView();

    expect(await screen.findByText("Ilha bloqueada")).toBeInTheDocument();
    expect(screen.getByText("A ilha está bloqueada. Conclua a ilha anterior antes de continuar.")).toBeInTheDocument();

    const catalogLink = screen.getByRole("link", { name: /Voltar ao catálogo de ilhas/i });
    expect(catalogLink).toHaveAttribute("href", "/ilhas");
  });

  it("renders island journey and back to all islands link", async () => {
    vi.mocked(learningService.getIsland).mockResolvedValue(mockIsland);
    vi.mocked(progressService.getProgressSnapshot).mockResolvedValue(mockSnapshot);

    renderView();

    expect(await screen.findByRole("heading", { name: "Ilha de Teste" })).toBeInTheDocument();
    expect(screen.getByText("Primeiro Nível")).toBeInTheDocument();

    const backLink = screen.getByRole("link", { name: /Todas as ilhas/i });
    expect(backLink).toHaveAttribute("href", "/ilhas");
  });
});
