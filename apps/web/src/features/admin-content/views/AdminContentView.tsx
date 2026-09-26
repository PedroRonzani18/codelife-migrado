import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Layers, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FeedbackAlert, LoadingState, PageContainer, RouteErrorState } from "@/shared/components";
import { ApiClientError, mapApiErrorMessage } from "@/shared/http";
import { AdminContentTree } from "../components/AdminContentTree";
import { DeleteConfirmModal } from "../components/DeleteConfirmModal";
import { IslandForm } from "../components/forms/IslandForm";
import { LevelForm } from "../components/forms/LevelForm";
import { SlideForm } from "../components/forms/SlideForm";
import { useAdminContentMutations } from "../hooks/useAdminContentMutations";
import { useAdminContentTreeQuery } from "../hooks/useAdminContentTreeQuery";
import { useAdminIslandQuery, useAdminLevelQuery, useAdminSlideQuery } from "../hooks/useAdminDetailQueries";
import type {
  CreateIslandInput,
  CreateLevelInput,
  CreateSlideInput,
  UpdateIslandInput,
  UpdateLevelInput,
  UpdateSlideInput,
} from "@codelife/contracts/content-management";

export function AdminContentView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const islandId = searchParams.get("islandId");
  const levelId = searchParams.get("levelId");
  const slideId = searchParams.get("slideId");
  const action = searchParams.get("action"); // "new-island" | "new-level" | "new-slide"

  const [isFormDirty, setIsFormDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [showDirtyModal, setShowDirtyModal] = useState(false);

  const [staleError, setStaleError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const treeQuery = useAdminContentTreeQuery();
  const mutations = useAdminContentMutations();

  // Queries for active selection
  const isCreatingIsland = action === "new-island";
  const isCreatingLevel = action === "new-level";
  const isCreatingSlide = action === "new-slide";

  const islandQuery = useAdminIslandQuery(
    islandId && !isCreatingIsland && (!levelId || isCreatingLevel) && (!slideId || isCreatingSlide) ? islandId : null
  );
  const levelQuery = useAdminLevelQuery(
    levelId && !isCreatingLevel && (!slideId || isCreatingSlide) ? levelId : null
  );
  const slideQuery = useAdminSlideQuery(slideId && !isCreatingSlide ? slideId : null);

  // Prompt before window reload / tab close if dirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isFormDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isFormDirty]);

  // Safe navigation wrapper with dirty guard
  const requestNavigation = (navFn: () => void) => {
    if (isFormDirty) {
      setPendingNavigation(() => navFn);
      setShowDirtyModal(true);
    } else {
      setStaleError(null);
      setGeneralError(null);
      setSuccessMessage(null);
      navFn();
    }
  };

  const handleConfirmDiscard = () => {
    setShowDirtyModal(false);
    setIsFormDirty(false);
    setStaleError(null);
    setGeneralError(null);
    setSuccessMessage(null);
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const handleCancelDiscard = () => {
    setShowDirtyModal(false);
    setPendingNavigation(null);
  };

  const handleReloadData = async () => {
    setStaleError(null);
    setGeneralError(null);
    await treeQuery.refetch();
    if (slideId) await slideQuery.refetch();
    else if (levelId) await levelQuery.refetch();
    else if (islandId) await islandQuery.refetch();
    setIsFormDirty(false);
  };

  // Node selection from tree
  const handleSelectNode = (type: "island" | "level" | "slide", id: string) => {
    requestNavigation(() => {
      if (type === "island") {
        setSearchParams({ islandId: id });
      } else if (type === "level") {
        // Find parent island
        const parentIsland = treeQuery.data?.find((i) => i.levels.some((l) => l.id === id));
        setSearchParams(parentIsland ? { islandId: parentIsland.id, levelId: id } : { levelId: id });
      } else if (type === "slide") {
        // Find parent level and island
        let foundIslandId: string | undefined;
        let foundLevelId: string | undefined;
        for (const i of treeQuery.data ?? []) {
          for (const l of i.levels) {
            if (l.slides.some((s) => s.id === id)) {
              foundIslandId = i.id;
              foundLevelId = l.id;
              break;
            }
          }
          if (foundLevelId) break;
        }
        const params: Record<string, string> = { slideId: id };
        if (foundIslandId) params.islandId = foundIslandId;
        if (foundLevelId) params.levelId = foundLevelId;
        setSearchParams(params);
      }
    });
  };

  // Creation actions
  const handleCreateIsland = () => {
    requestNavigation(() => {
      setSearchParams({ action: "new-island" });
    });
  };

  const handleCreateLevel = (parentIslandId: string) => {
    requestNavigation(() => {
      setSearchParams({ islandId: parentIslandId, action: "new-level" });
    });
  };

  const handleCreateSlide = (parentLevelId: string) => {
    requestNavigation(() => {
      const parentIsland = treeQuery.data?.find((i) => i.levels.some((l) => l.id === parentLevelId));
      const params: Record<string, string> = { levelId: parentLevelId, action: "new-slide" };
      if (parentIsland) params.islandId = parentIsland.id;
      setSearchParams(params);
    });
  };

  const handleBackToTree = () => {
    requestNavigation(() => {
      setSearchParams({});
    });
  };

  const handleApiError = (err: unknown) => {
    if (err instanceof ApiClientError && err.code === "CONTENT_STALE") {
      setStaleError(mapApiErrorMessage(err));
    } else {
      setGeneralError(mapApiErrorMessage(err));
    }
  };

  // Reordering
  const handleReorderIslands = async (islandIds: string[]) => {
    try {
      setGeneralError(null);
      await mutations.reorderIslands.mutateAsync({ islandIds });
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleReorderLevels = async (parentIslandId: string, levelIds: string[]) => {
    try {
      setGeneralError(null);
      await mutations.reorderLevels.mutateAsync({ islandId: parentIslandId, input: { levelIds } });
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleReorderSlides = async (parentLevelId: string, slideIds: string[]) => {
    try {
      setGeneralError(null);
      await mutations.reorderSlides.mutateAsync({ levelId: parentLevelId, input: { slideIds } });
    } catch (err) {
      handleApiError(err);
    }
  };

  // Island Form actions
  const handleIslandSubmit = async (data: CreateIslandInput | UpdateIslandInput) => {
    try {
      setGeneralError(null);
      setStaleError(null);
      if (isCreatingIsland) {
        const created = await mutations.createIsland.mutateAsync(data as CreateIslandInput);
        setIsFormDirty(false);
        setSuccessMessage("Ilha criada com sucesso!");
        setSearchParams({ islandId: created.id });
      } else if (islandId) {
        await mutations.updateIsland.mutateAsync({ islandId, input: data as UpdateIslandInput });
        setIsFormDirty(false);
        setSuccessMessage("Ilha atualizada com sucesso!");
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handlePublishIsland = async (expectedUpdatedAt?: string) => {
    if (!islandId) return;
    try {
      setGeneralError(null);
      setStaleError(null);
      await mutations.publishIsland.mutateAsync({ islandId, input: { expectedUpdatedAt } });
      setSuccessMessage("Ilha publicada com sucesso!");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleUnpublishIsland = async (expectedUpdatedAt?: string) => {
    if (!islandId) return;
    try {
      setGeneralError(null);
      setStaleError(null);
      await mutations.unpublishIsland.mutateAsync({ islandId, input: { expectedUpdatedAt } });
      setSuccessMessage("Ilha despublicada com sucesso!");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteIsland = async () => {
    if (!islandId) return;
    try {
      setGeneralError(null);
      setStaleError(null);
      await mutations.deleteIsland.mutateAsync(islandId);
      setIsFormDirty(false);
      setSuccessMessage("Ilha excluída com sucesso!");
      setSearchParams({});
    } catch (err) {
      handleApiError(err);
    }
  };

  // Level Form actions
  const handleLevelSubmit = async (data: CreateLevelInput | UpdateLevelInput) => {
    try {
      setGeneralError(null);
      setStaleError(null);
      if (isCreatingLevel && islandId) {
        const created = await mutations.createLevel.mutateAsync({ islandId, input: data as CreateLevelInput });
        setIsFormDirty(false);
        setSuccessMessage("Nível criado com sucesso!");
        setSearchParams({ islandId, levelId: created.id });
      } else if (levelId) {
        await mutations.updateLevel.mutateAsync({ levelId, input: data as UpdateLevelInput });
        setIsFormDirty(false);
        setSuccessMessage("Nível atualizado com sucesso!");
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handlePublishLevel = async (expectedUpdatedAt?: string) => {
    if (!levelId) return;
    try {
      setGeneralError(null);
      setStaleError(null);
      await mutations.publishLevel.mutateAsync({ levelId, input: { expectedUpdatedAt } });
      setSuccessMessage("Nível publicado com sucesso!");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleUnpublishLevel = async (expectedUpdatedAt?: string) => {
    if (!levelId) return;
    try {
      setGeneralError(null);
      setStaleError(null);
      await mutations.unpublishLevel.mutateAsync({ levelId, input: { expectedUpdatedAt } });
      setSuccessMessage("Nível despublicado com sucesso!");
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteLevel = async () => {
    if (!levelId) return;
    try {
      setGeneralError(null);
      setStaleError(null);
      await mutations.deleteLevel.mutateAsync({ levelId, islandId: islandId ?? undefined });
      setIsFormDirty(false);
      setSuccessMessage("Nível excluído com sucesso!");
      setSearchParams(islandId ? { islandId } : {});
    } catch (err) {
      handleApiError(err);
    }
  };

  // Slide Form actions
  const handleSlideSubmit = async (data: CreateSlideInput | UpdateSlideInput) => {
    try {
      setGeneralError(null);
      setStaleError(null);
      if (isCreatingSlide && levelId) {
        const created = await mutations.createSlide.mutateAsync({ levelId, input: data as CreateSlideInput });
        setIsFormDirty(false);
        setSuccessMessage("Slide criado com sucesso!");
        setSearchParams({
          ...(islandId ? { islandId } : {}),
          levelId,
          slideId: created.id,
        });
      } else if (slideId) {
        await mutations.updateSlide.mutateAsync({ slideId, input: data as UpdateSlideInput });
        setIsFormDirty(false);
        setSuccessMessage("Slide atualizado com sucesso!");
      }
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteSlide = async () => {
    if (!slideId) return;
    try {
      setGeneralError(null);
      setStaleError(null);
      await mutations.deleteSlide.mutateAsync({ slideId, levelId: levelId ?? undefined });
      setIsFormDirty(false);
      setSuccessMessage("Slide excluído com sucesso!");
      setSearchParams({
        ...(islandId ? { islandId } : {}),
        ...(levelId ? { levelId } : {}),
      });
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleUploadMedia = async (file: File) => {
    return mutations.uploadMedia.mutateAsync(file);
  };

  // Loading / Error handling for tree
  if (treeQuery.isLoading) {
    return (
      <PageContainer>
        <LoadingState label="Carregando estrutura de conteúdo..." />
      </PageContainer>
    );
  }

  if (treeQuery.isError) {
    return (
      <PageContainer>
        <RouteErrorState
          title="Erro ao carregar conteúdo"
          description="Não foi possível carregar a estrutura de conteúdo administrativo."
          onRetry={() => void treeQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const tree = treeQuery.data ?? [];

  // Determine current active item selection type and id
  let activeType: "island" | "level" | "slide" | null = null;
  let activeId: string | null = null;
  if (slideId && !isCreatingSlide) {
    activeType = "slide";
    activeId = slideId;
  } else if (levelId && !isCreatingLevel) {
    activeType = "level";
    activeId = levelId;
  } else if (islandId && !isCreatingIsland) {
    activeType = "island";
    activeId = islandId;
  }

  const isEditingOrCreating = Boolean(action || activeId);
  const isAnyMutationPending = Object.values(mutations).some((m) => m.isPending);

  return (
    <PageContainer>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Administração de Conteúdo
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Gerencie a hierarquia de aprendizado: Ilhas, Níveis e Slides com visualização e publicação direta.
            </p>
          </div>
        </div>

        {/* Global / Conflict Alerts */}
        {staleError && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-500">
            <div className="space-y-1">
              <p className="font-semibold">Conflito de versão detectado</p>
              <p>{staleError}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReloadData}
              className="gap-1.5 border-amber-500/40 text-amber-500 hover:bg-amber-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Recarregar dados
            </Button>
          </div>
        )}

        {generalError && (
          <FeedbackAlert
            kind="error"
            title="Não foi possível concluir a ação"
            description={generalError}
          />
        )}

        {successMessage && (
          <FeedbackAlert
            kind="success"
            title="Operação concluída"
            description={successMessage}
          />
        )}

        {/* Responsive Grid: Tree + Editor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Tree Column: Hidden on mobile if currently editing/creating */}
          <div
            className={`lg:col-span-4 xl:col-span-4 ${
              isEditingOrCreating ? "hidden lg:block" : "block"
            }`}
          >
            <Card className="border-border shadow-sm">
              <CardContent className="p-4 sm:p-5">
                <AdminContentTree
                  tree={tree}
                  selectedId={activeId}
                  selectedType={activeType}
                  onSelect={handleSelectNode}
                  onCreateIsland={handleCreateIsland}
                  onCreateLevel={handleCreateLevel}
                  onCreateSlide={handleCreateSlide}
                  onReorderIslands={handleReorderIslands}
                  onReorderLevels={handleReorderLevels}
                  onReorderSlides={handleReorderSlides}
                  isPending={isAnyMutationPending}
                />
              </CardContent>
            </Card>
          </div>

          {/* Editor Column: Hidden on mobile if not editing/creating */}
          <div
            className={`lg:col-span-8 xl:col-span-8 ${
              !isEditingOrCreating ? "hidden lg:block" : "block"
            }`}
          >
            {/* Mobile Back Button */}
            {isEditingOrCreating && (
              <div className="mb-4 lg:hidden">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBackToTree}
                  className="gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para a Estrutura
                </Button>
              </div>
            )}

            <Card className="border-border shadow-sm">
              <CardContent className="p-6 sm:p-8">
                {/* 1. New Island */}
                {isCreatingIsland && (
                  <IslandForm
                    isCreating={true}
                    isPending={mutations.createIsland.isPending}
                    onSubmit={handleIslandSubmit}
                    onCancel={handleBackToTree}
                    onDirtyChange={setIsFormDirty}
                  />
                )}

                {/* 2. New Level */}
                {isCreatingLevel && islandId && (
                  <LevelForm
                    islandId={islandId}
                    isCreating={true}
                    isPending={mutations.createLevel.isPending}
                    onSubmit={handleLevelSubmit}
                    onCancel={handleBackToTree}
                    onDirtyChange={setIsFormDirty}
                  />
                )}

                {/* 3. New Slide */}
                {isCreatingSlide && levelId && (
                  <SlideForm
                    levelId={levelId}
                    isCreating={true}
                    isPending={mutations.createSlide.isPending}
                    onSubmit={handleSlideSubmit}
                    onUploadMedia={handleUploadMedia}
                    onCancel={handleBackToTree}
                    onDirtyChange={setIsFormDirty}
                  />
                )}

                {/* 4. Edit Slide */}
                {!action && slideId && (
                  slideQuery.isLoading ? (
                    <LoadingState label="Carregando dados do slide..." />
                  ) : slideQuery.isError ? (
                    <RouteErrorState
                      title="Erro ao carregar slide"
                      description="Não foi possível recuperar os detalhes deste slide."
                      onRetry={() => void slideQuery.refetch()}
                    />
                  ) : (
                    <SlideForm
                      key={slideId}
                      levelId={levelId ?? ""}
                      slide={slideQuery.data}
                      isCreating={false}
                      isPending={mutations.updateSlide.isPending || mutations.deleteSlide.isPending}
                      onSubmit={handleSlideSubmit}
                      onUploadMedia={handleUploadMedia}
                      onDelete={handleDeleteSlide}
                      onCancel={handleBackToTree}
                      onDirtyChange={setIsFormDirty}
                    />
                  )
                )}

                {/* 5. Edit Level */}
                {!action && !slideId && levelId && (
                  levelQuery.isLoading ? (
                    <LoadingState label="Carregando dados do nível..." />
                  ) : levelQuery.isError ? (
                    <RouteErrorState
                      title="Erro ao carregar nível"
                      description="Não foi possível recuperar os detalhes deste nível."
                      onRetry={() => void levelQuery.refetch()}
                    />
                  ) : (
                    <LevelForm
                      key={levelId}
                      islandId={islandId ?? ""}
                      level={levelQuery.data}
                      isCreating={false}
                      isPending={
                        mutations.updateLevel.isPending ||
                        mutations.publishLevel.isPending ||
                        mutations.unpublishLevel.isPending ||
                        mutations.deleteLevel.isPending
                      }
                      onSubmit={handleLevelSubmit}
                      onPublish={handlePublishLevel}
                      onUnpublish={handleUnpublishLevel}
                      onDelete={handleDeleteLevel}
                      onCancel={handleBackToTree}
                      onDirtyChange={setIsFormDirty}
                    />
                  )
                )}

                {/* 6. Edit Island */}
                {!action && !slideId && !levelId && islandId && (
                  islandQuery.isLoading ? (
                    <LoadingState label="Carregando dados da ilha..." />
                  ) : islandQuery.isError ? (
                    <RouteErrorState
                      title="Erro ao carregar ilha"
                      description="Não foi possível recuperar os detalhes desta ilha."
                      onRetry={() => void islandQuery.refetch()}
                    />
                  ) : (
                    <IslandForm
                      key={islandId}
                      island={islandQuery.data}
                      isCreating={false}
                      isPending={
                        mutations.updateIsland.isPending ||
                        mutations.publishIsland.isPending ||
                        mutations.unpublishIsland.isPending ||
                        mutations.deleteIsland.isPending
                      }
                      onSubmit={handleIslandSubmit}
                      onPublish={handlePublishIsland}
                      onUnpublish={handleUnpublishIsland}
                      onDelete={handleDeleteIsland}
                      onCancel={handleBackToTree}
                      onDirtyChange={setIsFormDirty}
                    />
                  )
                )}

                {/* 7. Empty State */}
                {!isEditingOrCreating && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
                      <Layers className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Nenhum item selecionado
                    </h3>
                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                      Selecione uma ilha, nível ou slide na árvore à esquerda para editar, ou crie uma nova ilha para começar.
                    </p>
                    <div className="mt-6 flex items-center gap-3">
                      <Button type="button" onClick={handleCreateIsland} className="gap-2">
                        <BookOpen className="h-4 w-4" />
                        Nova Ilha
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dirty Guard Modal */}
      <DeleteConfirmModal
        isOpen={showDirtyModal}
        title="Alterações não salvas"
        description="Existem alterações não salvas no formulário atual. Se você mudar de item ou sair agora, suas alterações serão perdidas. Deseja realmente descartar as alterações?"
        confirmLabel="Descartar alterações"
        cancelLabel="Continuar editando"
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />
    </PageContainer>
  );
}
