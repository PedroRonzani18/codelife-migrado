import { useState } from "react";
import type { AdminContentTree as AdminContentTreeType } from "@codelife/contracts/content-management";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, FileText, Folder, Layers, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type AdminContentTreeProps = {
  tree: AdminContentTreeType;
  selectedId?: string | null;
  selectedType?: "island" | "level" | "slide" | null;
  onSelect: (type: "island" | "level" | "slide", id: string) => void;
  onCreateIsland: () => void;
  onCreateLevel: (islandId: string) => void;
  onCreateSlide: (levelId: string) => void;
  onReorderIslands?: (newOrderIds: string[]) => void;
  onReorderLevels?: (islandId: string, newOrderIds: string[]) => void;
  onReorderSlides?: (levelId: string, newOrderIds: string[]) => void;
  isPending?: boolean;
};

export function AdminContentTree({
  tree,
  selectedId,
  selectedType,
  onSelect,
  onCreateIsland,
  onCreateLevel,
  onCreateSlide,
  onReorderIslands,
  onReorderLevels,
  onReorderSlides,
  isPending = false,
}: AdminContentTreeProps) {
  // Expanded state for collapsible tree nodes
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const island of tree) {
      initial[island.id] = true;
      for (const level of island.levels) {
        initial[level.id] = true;
      }
    }
    return initial;
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const moveIsland = (index: number, direction: "up" | "down") => {
    if (!onReorderIslands) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= tree.length) return;
    const newItems = [...tree];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    onReorderIslands(newItems.map((item) => item.id));
  };

  const moveLevel = (islandId: string, levels: typeof tree[0]["levels"], index: number, direction: "up" | "down") => {
    if (!onReorderLevels) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= levels.length) return;
    const newItems = [...levels];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    onReorderLevels(islandId, newItems.map((item) => item.id));
  };

  const moveSlide = (levelId: string, slides: typeof tree[0]["levels"][0]["slides"], index: number, direction: "up" | "down") => {
    if (!onReorderSlides) return;
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= slides.length) return;
    const newItems = [...slides];
    const [moved] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, moved);
    onReorderSlides(levelId, newItems.map((item) => item.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b pb-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Estrutura de Conteúdo
        </h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={onCreateIsland}
          className="gap-1.5 text-xs"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Nova Ilha
        </Button>
      </div>

      {tree.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Nenhuma ilha cadastrada. Clique em "Nova Ilha" para começar.
        </div>
      ) : (
        <ul role="tree" aria-label="Árvore de conteúdo" className="space-y-2">
          {tree.map((island, islandIndex) => {
            const isIslandExpanded = expandedNodes[island.id] ?? true;
            const isIslandSelected = selectedType === "island" && selectedId === island.id;
            const isIslandPublished = Boolean(island.publishedAt);

            return (
              <li
                key={island.id}
                role="treeitem"
                aria-expanded={isIslandExpanded}
                aria-selected={isIslandSelected}
                className="rounded-lg border border-border bg-card p-2 shadow-xs transition-colors"
              >
                <div
                  className={`flex items-center justify-between rounded-md p-2 transition-colors ${
                    isIslandSelected
                      ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/30"
                      : "hover:bg-accent hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      aria-label={isIslandExpanded ? `Recolher ilha ${island.title}` : `Expandir ilha ${island.title}`}
                      onClick={() => toggleNode(island.id)}
                      className="text-muted-foreground hover:text-foreground p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    >
                      {isIslandExpanded ? (
                        <ChevronDown className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                    <Folder className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
                    <button
                      type="button"
                      onClick={() => onSelect("island", island.id)}
                      className="truncate text-left text-sm hover:underline focus-visible:outline-none"
                    >
                      {island.title}
                    </button>
                    <Badge variant={isIslandPublished ? "default" : "outline"} className="text-[10px] py-0 px-1.5 shrink-0">
                      {isIslandPublished ? "Pub" : "Rasc"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={isPending || islandIndex === 0}
                      aria-label={`Mover ilha "${island.title}" para cima`}
                      onClick={() => moveIsland(islandIndex, "up")}
                    >
                      <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      disabled={isPending || islandIndex === tree.length - 1}
                      aria-label={`Mover ilha "${island.title}" para baixo`}
                      onClick={() => moveIsland(islandIndex, "down")}
                    >
                      <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                      disabled={isPending}
                      aria-label={`Adicionar nível na ilha ${island.title}`}
                      onClick={() => onCreateLevel(island.id)}
                    >
                      <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {/* Levels list */}
                {isIslandExpanded && (
                  <ul role="group" className="mt-1 space-y-1.5 border-l-2 border-border/50 pl-3 ml-3">
                    {island.levels.length === 0 ? (
                      <li className="py-1 text-xs text-muted-foreground italic">
                        Nenhum nível. Clique em "+" para criar.
                      </li>
                    ) : (
                      island.levels.map((level, levelIndex) => {
                        const isLevelExpanded = expandedNodes[level.id] ?? true;
                        const isLevelSelected = selectedType === "level" && selectedId === level.id;
                        const isLevelPublished = Boolean(level.publishedAt);

                        return (
                          <li
                            key={level.id}
                            role="treeitem"
                            aria-expanded={isLevelExpanded}
                            aria-selected={isLevelSelected}
                            className="rounded-md"
                          >
                            <div
                              className={`flex items-center justify-between rounded-md p-1.5 transition-colors ${
                                isLevelSelected
                                  ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/30"
                                  : "hover:bg-accent/70 hover:text-foreground"
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <button
                                  type="button"
                                  aria-label={isLevelExpanded ? `Recolher nível ${level.title}` : `Expandir nível ${level.title}`}
                                  onClick={() => toggleNode(level.id)}
                                  className="text-muted-foreground hover:text-foreground p-0.5 rounded focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                >
                                  {isLevelExpanded ? (
                                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                                  ) : (
                                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                                  )}
                                </button>
                                <Layers className="h-3.5 w-3.5 text-blue-500 shrink-0" aria-hidden="true" />
                                <button
                                  type="button"
                                  onClick={() => onSelect("level", level.id)}
                                  className="truncate text-left text-xs hover:underline focus-visible:outline-none"
                                >
                                  {level.title}
                                </button>
                                <Badge variant={isLevelPublished ? "default" : "outline"} className="text-[9px] py-0 px-1 shrink-0">
                                  {isLevelPublished ? "Pub" : "Rasc"}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-0.5 shrink-0">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  disabled={isPending || levelIndex === 0}
                                  aria-label={`Mover nível "${level.title}" para cima`}
                                  onClick={() => moveLevel(island.id, island.levels, levelIndex, "up")}
                                >
                                  <ArrowUp className="h-3 w-3" aria-hidden="true" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  disabled={isPending || levelIndex === island.levels.length - 1}
                                  aria-label={`Mover nível "${level.title}" para baixo`}
                                  onClick={() => moveLevel(island.id, island.levels, levelIndex, "down")}
                                >
                                  <ArrowDown className="h-3 w-3" aria-hidden="true" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                  disabled={isPending}
                                  aria-label={`Adicionar slide no nível ${level.title}`}
                                  onClick={() => onCreateSlide(level.id)}
                                >
                                  <Plus className="h-3 w-3" aria-hidden="true" />
                                </Button>
                              </div>
                            </div>

                            {/* Slides list */}
                            {isLevelExpanded && (
                              <ul role="group" className="mt-1 space-y-1 border-l-2 border-border/40 pl-3 ml-3">
                                {level.slides.length === 0 ? (
                                  <li className="py-0.5 text-xs text-muted-foreground italic">
                                    Nenhum slide. Clique em "+" para criar.
                                  </li>
                                ) : (
                                  level.slides.map((slide, slideIndex) => {
                                    const isSlideSelected = selectedType === "slide" && selectedId === slide.id;

                                    return (
                                      <li
                                        key={slide.id}
                                        role="treeitem"
                                        aria-selected={isSlideSelected}
                                        className={`flex items-center justify-between rounded-md p-1 transition-colors ${
                                          isSlideSelected
                                            ? "bg-primary/10 text-primary font-medium ring-1 ring-primary/30"
                                            : "hover:bg-accent/60 hover:text-foreground"
                                        }`}
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <FileText className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
                                          <button
                                            type="button"
                                            onClick={() => onSelect("slide", slide.id)}
                                            className="truncate text-left text-xs hover:underline focus-visible:outline-none"
                                          >
                                            {slide.position}. {slide.title}
                                          </button>
                                          <span className="text-[9px] text-muted-foreground shrink-0 bg-muted px-1 rounded">
                                            {slide.type}
                                          </span>
                                        </div>

                                        <div className="flex items-center gap-0.5 shrink-0">
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0"
                                            disabled={isPending || slideIndex === 0}
                                            aria-label={`Mover slide "${slide.title}" para cima`}
                                            onClick={() => moveSlide(level.id, level.slides, slideIndex, "up")}
                                          >
                                            <ArrowUp className="h-2.5 w-2.5" aria-hidden="true" />
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-5 w-5 p-0"
                                            disabled={isPending || slideIndex === level.slides.length - 1}
                                            aria-label={`Mover slide "${slide.title}" para baixo`}
                                            onClick={() => moveSlide(level.id, level.slides, slideIndex, "down")}
                                          >
                                            <ArrowDown className="h-2.5 w-2.5" aria-hidden="true" />
                                          </Button>
                                        </div>
                                      </li>
                                    );
                                  })
                                )}
                              </ul>
                            )}
                          </li>
                        );
                      })
                    )}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
