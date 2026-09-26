import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { stableKeySchema } from '@codelife/contracts/common';
import { Button } from '@/components/ui/button';
import { ApiClientError, domainErrorMessage } from '@/shared/http';
import { FeedbackAlert, LoadingState, PageContainer, RouteErrorState } from '@/shared/components';
import { IslandJourneyPath } from '../components/IslandJourneyPath';
import { selectIslandJourney } from '../selectors/selectLearning';
import { useIslandQuery, useProgressSnapshotQuery } from '../hooks/useLearningQueries';
import { useStartLevelMutation } from '../hooks/useProgressMutations';

export default function IslandView() {
  const navigate = useNavigate();
  const params = useParams<{ islandSlug: string }>();
  const parsedSlug = stableKeySchema.safeParse(params.islandSlug);
  const slug = parsedSlug.success ? parsedSlug.data : '';
  const island = useIslandQuery(slug);
  const snapshot = useProgressSnapshotQuery(Boolean(slug));
  const start = useStartLevelMutation();
  const [startError, setStartError] = useState<ApiClientError | null>(null);

  if (!parsedSlug.success) return <PageContainer><RouteErrorState title="Endereço inválido" description="A ilha informada não possui um identificador válido." /></PageContainer>;
  if (island.isLoading || snapshot.isLoading) return <PageContainer><LoadingState label="Carregando sua jornada…" cards={3} /></PageContainer>;
  const queryError = island.error ?? snapshot.error;
  if (queryError) {
    const error = queryError instanceof ApiClientError ? queryError : undefined;
    const isBlocked = error?.code === 'ISLAND_BLOCKED';
    return (
      <PageContainer className="py-10 sm:py-14 space-y-6">
        <RouteErrorState
          title={isBlocked ? 'Ilha bloqueada' : 'Não foi possível carregar a jornada'}
          description={error ? domainErrorMessage(error.code) : 'Não foi possível carregar a jornada.'}
          requestId={error?.requestId}
          onRetry={isBlocked ? undefined : () => { void island.refetch(); void snapshot.refetch(); }}
        />
        {isBlocked && (
          <div className="flex justify-center">
            <Button asChild variant="default">
              <Link to="/ilhas">Voltar ao catálogo de ilhas</Link>
            </Button>
          </div>
        )}
      </PageContainer>
    );
  }

  const levels = selectIslandJourney(island.data, snapshot.data);
  function openLevel(levelId: string) {
    const level = levels.find((candidate) => candidate.id === levelId);
    if (!level || level.availability === 'blocked') return;
    if (level.availability === 'available') {
      setStartError(null);
      start.mutate(level.id, {
        onSuccess: (nextSnapshot) => {
          const started = selectIslandJourney(island.data, nextSnapshot).find((candidate) => candidate.id === level.id);
          if (started?.progress) navigate(`/ilhas/${slug}/niveis/${level.id}/slides/${started.progress.currentSlideId}`);
        },
        onError: (error) => setStartError(error instanceof ApiClientError ? error : null),
      });
      return;
    }
    if (level.progress) navigate(`/ilhas/${slug}/niveis/${level.id}/slides/${level.progress.currentSlideId}`);
  }

  return (
    <PageContainer className="py-10 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to="/ilhas"><ArrowLeft aria-hidden="true" /> Todas as ilhas</Link>
      </Button>
      <IslandJourneyPath title={island.data?.title ?? 'Jornada'} levels={levels} isPending={start.isPending} onOpenLevel={openLevel} />
      {startError && <FeedbackAlert className="mt-5" kind="error" title="Não foi possível iniciar o nível" description={domainErrorMessage(startError.code)} requestId={startError.requestId} />}
    </PageContainer>
  );
}
