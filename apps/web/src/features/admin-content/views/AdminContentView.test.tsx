import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminContentView } from "./AdminContentView";
import { adminContentService } from "../services/adminContentService";
import type { AdminContentTree } from "@codelife/contracts/content-management";

vi.mock("../services/adminContentService", () => ({
  adminContentService: {
    getTree: vi.fn(),
    getIsland: vi.fn(),
    getLevel: vi.fn(),
    getSlide: vi.fn(),
    createIsland: vi.fn(),
    updateIsland: vi.fn(),
    deleteIsland: vi.fn(),
    publishIsland: vi.fn(),
    unpublishIsland: vi.fn(),
    reorderIslands: vi.fn(),
    createLevel: vi.fn(),
    updateLevel: vi.fn(),
    deleteLevel: vi.fn(),
    publishLevel: vi.fn(),
    unpublishLevel: vi.fn(),
    reorderLevels: vi.fn(),
    createSlide: vi.fn(),
    updateSlide: vi.fn(),
    deleteSlide: vi.fn(),
    reorderSlides: vi.fn(),
    uploadMedia: vi.fn(),
  },
}));

const mockTree: AdminContentTree = [
  {
    id: "island-1",
    slug: "island-1",
    title: "Ilha Alpha",
    position: 1,
    publishedAt: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    levels: [],
  },
];

function renderView(initialRoute = "/admin/content") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: 0 },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialRoute]}>
        <AdminContentView />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AdminContentView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(cleanup);

  it("shows loading state while fetching tree", () => {
    vi.mocked(adminContentService.getTree).mockReturnValue(new Promise(() => {}));

    renderView();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando estrutura de conteúdo...");
  });

  it("renders tree and empty state when nothing is selected", async () => {
    vi.mocked(adminContentService.getTree).mockResolvedValue(mockTree);

    renderView();

    expect(await screen.findByRole("heading", { name: "Administração de Conteúdo" })).toBeInTheDocument();
    expect(screen.getByText("Ilha Alpha")).toBeInTheDocument();
    expect(screen.getByText("Nenhum item selecionado")).toBeInTheDocument();
  });

  it("opens create island form on Nova Ilha click", async () => {
    const user = userEvent.setup();
    vi.mocked(adminContentService.getTree).mockResolvedValue(mockTree);

    renderView();

    const newIslandBtns = await screen.findAllByRole("button", { name: "Nova Ilha" });
    await user.click(newIslandBtns[0]);

    expect(await screen.findByRole("heading", { name: "Nova Ilha" })).toBeInTheDocument();
    expect(screen.getByLabelText(/título/i)).toBeInTheDocument();
  });

  it("triggers dirty guard modal when navigating away with unsaved changes", async () => {
    const user = userEvent.setup();
    vi.mocked(adminContentService.getTree).mockResolvedValue(mockTree);

    renderView();

    const newIslandBtns = await screen.findAllByRole("button", { name: "Nova Ilha" });
    await user.click(newIslandBtns[0]);

    // Type into title field to make form dirty
    const titleInput = await screen.findByLabelText(/título/i);
    await user.type(titleInput, "Ilha com alteração pendente");

    // Click on Ilha Alpha in the tree
    await user.click(screen.getByText("Ilha Alpha"));

    // Modal should appear
    expect(await screen.findByText("Alterações não salvas")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Descartar alterações" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuar editando" })).toBeInTheDocument();
  });
});
