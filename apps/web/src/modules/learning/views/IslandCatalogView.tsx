import { Compass } from "lucide-react";
import { LoadingState, PageContainer, RouteErrorState } from "@/shared/components";
import { ApiClientError, domainErrorMessage } from "@/shared/http";
import { IslandCard } from "../components/IslandCard";
import { useIslandCatalogQuery } from "../hooks/useLearningQueries";

export function IslandCatalogView() {
  const catalogQuery = useIslandCatalogQuery();

  if (catalogQuery.isLoading) {
    return (
      <PageContainer className="py-10 sm:py-14">
        <LoadingState label="Carregando catálogo de ilhas…" cards={3} />
      </PageContainer>
    );
  }

  if (catalogQuery.isError) {
    const error = catalogQuery.error instanceof ApiClientError ? catalogQuery.error : undefined;
    return (
      <PageContainer className="py-10 sm:py-14">
        <RouteErrorState
          title="Não foi possível carregar as ilhas"
          description={error ? domainErrorMessage(error.code) : "Ocorreu uma falha ao recuperar o catálogo de ilhas."}
          requestId={error?.requestId}
          onRetry={() => void catalogQuery.refetch()}
        />
      </PageContainer>
    );
  }

  const islands = catalogQuery.data ?? [];

  return (
    <PageContainer className="py-10 sm:py-14 space-y-8">
      <div className="space-y-2 border-b pb-5">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Ilhas de Aprendizado
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base max-w-2xl">
          Navegue pelas ilhas de conteúdo do CodeLife. Conclua os níveis de cada ilha para desbloquear as etapas seguintes da sua jornada.
        </p>
      </div>

      {islands.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border p-12 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary mb-4">
            <Compass className="h-8 w-8" aria-hidden="true" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            Nenhuma ilha publicada
          </h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Não há ilhas publicadas disponíveis no momento. Volte em breve para novos conteúdos de aprendizado!
          </p>
        </div>
      ) : (
        <div
          role="region"
          aria-label="Lista de ilhas de aprendizado"
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {islands.map((island) => (
            <IslandCard key={island.id} island={island} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

export default IslandCatalogView;
