import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { stableKeySchema } from '@codelife/contracts/common';
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
    return <PageContainer><RouteErrorState description={error ? domainErrorMessage(error.code) : 'Não foi possível carregar a jornada.'} requestId={error?.requestId} onRetry={() => { void island.refetch(); void snapshot.refetch(); }} /></PageContainer>;
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
      <IslandJourneyPath title={island.data?.title ?? 'Interatividade'} levels={levels} isPending={start.isPending} onOpenLevel={openLevel} />
      {startError && <FeedbackAlert className="mt-5" kind="error" title="Não foi possível iniciar o nível" description={domainErrorMessage(startError.code)} requestId={startError.requestId} />}
    </PageContainer>
  );
}
