import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { stableKeySchema, uuidSchema } from '@codelife/contracts/common';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ApiClientError, domainErrorMessage } from '@/shared/http';
import { FeedbackAlert, LoadingState, PageContainer, RouteErrorState } from '@/shared/components';
import { SlideNavigation } from '../components/SlideNavigation';
import { SlideRenderer } from '../components/slide-renderers/SlideRenderer';
import { useLevelQuery, useProgressSnapshotQuery } from '../hooks/useLearningQueries';
import { useCompleteLevelMutation, useNavigateToSlideMutation, useStartLevelMutation } from '../hooks/useProgressMutations';
import { selectLevelProgress } from '../selectors/selectLearning';

function errorData(error: unknown) {
  return error instanceof ApiClientError ? { description: domainErrorMessage(error.code), requestId: error.requestId } : { description: 'Não foi possível concluir a solicitação.', requestId: undefined };
}

export default function LevelReaderView() {
  const params = useParams<{ islandSlug: string; levelId: string; slideId: string }>();
  const navigateRoute = useNavigate();
  const slugResult = stableKeySchema.safeParse(params.islandSlug);
  const levelResult = uuidSchema.safeParse(params.levelId);
  const slideResult = uuidSchema.safeParse(params.slideId);
  const slug = slugResult.success ? slugResult.data : '';
  const levelId = levelResult.success ? levelResult.data : '';
  const routeSlideId = slideResult.success ? slideResult.data : '';
  const snapshot = useProgressSnapshotQuery(Boolean(levelId));
  const progressLevel = selectLevelProgress(snapshot.data, levelId);
  const mayRead = Boolean(progressLevel?.progress) && progressLevel?.availability !== 'blocked';
  const level = useLevelQuery(levelId, mayRead);
  const start = useStartLevelMutation();
  const navigateSlide = useNavigateToSlideMutation();
  const complete = useCompleteLevelMutation();
  const [commandError, setCommandError] = useState<ApiClientError | null>(null);
  const [completedMessage, setCompletedMessage] = useState(false);
  const lastAutomaticAttempt = useRef<string | null>(null);
  const lastStartAttempt = useRef<string | null>(null);
  const pendingRouteTarget = useRef<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const confirmedSlideId = progressLevel?.progress?.currentSlideId;
  const isCommandPending = start.isPending || navigateSlide.isPending || complete.isPending;

  const slidePath = useCallback((slideId: string) => `/ilhas/${slug}/niveis/${levelId}/slides/${slideId}`, [slug, levelId]);

  const persistAndOpen = useCallback((targetSlideId: string, replace = false) => {
    if (!levelId || isCommandPending || targetSlideId === confirmedSlideId) return;
    pendingRouteTarget.current = targetSlideId;
    setCommandError(null);
    void navigateSlide.mutateAsync({ levelId, slideId: targetSlideId })
      .then(() => navigateRoute(slidePath(targetSlideId), { replace }))
      .catch((error: unknown) => {
        pendingRouteTarget.current = null;
        setCommandError(error instanceof ApiClientError ? error : null);
        if (confirmedSlideId) navigateRoute(slidePath(confirmedSlideId), { replace: true });
      });
  }, [confirmedSlideId, isCommandPending, levelId, navigateRoute, navigateSlide, slidePath]);

  useEffect(() => {
    if (routeSlideId === confirmedSlideId) {
      if (pendingRouteTarget.current === routeSlideId) pendingRouteTarget.current = null;
      return;
    }
    if (!routeSlideId || !confirmedSlideId || !level.data || pendingRouteTarget.current === confirmedSlideId || navigateSlide.isPending) return;
    const attempt = `${confirmedSlideId}:${routeSlideId}`;
    if (lastAutomaticAttempt.current === attempt) return;
    lastAutomaticAttempt.current = attempt;
    const belongsToLevel = level.data.slides.some((candidate) => candidate.id === routeSlideId);
    if (!belongsToLevel) {
      setCommandError(new ApiClientError(404, 'RESOURCE_NOT_FOUND', 'Slide não encontrado neste nível.'));
      navigateRoute(slidePath(confirmedSlideId), { replace: true });
      return;
    }
    persistAndOpen(routeSlideId, true);
  }, [confirmedSlideId, level.data, navigateRoute, navigateSlide.isPending, persistAndOpen, routeSlideId, slidePath]);

  useEffect(() => {
    if (!progressLevel || progressLevel.availability === 'blocked' || progressLevel.progress || lastStartAttempt.current === levelId) return;
    lastStartAttempt.current = levelId;
    setCommandError(null);
    void start.mutateAsync(levelId)
      .then((nextSnapshot) => {
        const started = selectLevelProgress(nextSnapshot, levelId);
        if (started?.progress) navigateRoute(slidePath(started.progress.currentSlideId), { replace: true });
      })
      .catch((error: unknown) => setCommandError(error instanceof ApiClientError ? error : null));
  }, [levelId, navigateRoute, progressLevel, slidePath, start]);

  useEffect(() => {
    if (confirmedSlideId) headingRef.current?.focus();
  }, [confirmedSlideId]);

  useEffect(() => {
    if (commandError) alertRef.current?.focus();
  }, [commandError]);

  const displayedSlide = level.data?.slides.find((candidate) => candidate.id === confirmedSlideId);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || isCommandPending) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      if (event.key === 'ArrowLeft' && displayedSlide?.previousSlideId) {
        event.preventDefault();
        persistAndOpen(displayedSlide.previousSlideId);
      }
      if (event.key === 'ArrowRight' && displayedSlide?.nextSlideId) {
        event.preventDefault();
        persistAndOpen(displayedSlide.nextSlideId);
      }
    }
    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [displayedSlide, isCommandPending, persistAndOpen]);

  if (!slugResult.success || !levelResult.success || !slideResult.success) return <PageContainer><RouteErrorState title="Endereço inválido" description="O nível ou slide informado não possui um identificador válido." /></PageContainer>;
  if (snapshot.isLoading) return <PageContainer><LoadingState label="Recuperando seu progresso…" /></PageContainer>;
  if (snapshot.error) {
    const error = errorData(snapshot.error);
    return <PageContainer><RouteErrorState {...error} onRetry={() => void snapshot.refetch()} /></PageContainer>;
  }
  if (!progressLevel) return <PageContainer><RouteErrorState title="Nível não encontrado" description="Este nível não pertence à jornada experimental." /></PageContainer>;
  if (progressLevel.availability === 'blocked') return <PageContainer><RouteErrorState title="Nível bloqueado" description="Conclua o nível anterior antes de continuar." /></PageContainer>;
  if (!progressLevel.progress) {
    if (commandError) {
      return <PageContainer><RouteErrorState title="Não foi possível iniciar o nível" description={domainErrorMessage(commandError.code)} requestId={commandError.requestId} onRetry={() => { lastStartAttempt.current = null; start.reset(); setCommandError(null); }} /></PageContainer>;
    }
    return <PageContainer><LoadingState label="Abrindo o nível…" /></PageContainer>;
  }
  if (level.isLoading) return <PageContainer><LoadingState label="Carregando o nível…" /></PageContainer>;
  if (level.error) {
    const error = errorData(level.error);
    return <PageContainer><RouteErrorState {...error} onRetry={() => void level.refetch()} /></PageContainer>;
  }
  if (!displayedSlide || !level.data) return <PageContainer><RouteErrorState title="Slide não encontrado" description="O cursor salvo não corresponde ao conteúdo deste nível." /></PageContainer>;

  const isCompleted = progressLevel.availability === 'completed' || Boolean(progressLevel.progress.completedAt);
  const canComplete = !displayedSlide.nextSlideId && !isCompleted;
  const currentIsland = snapshot.data?.islands.find((candidate) => candidate.levels.some((candidateLevel) => candidateLevel.id === levelId));
  const currentLevelIndex = currentIsland?.levels.findIndex((candidate) => candidate.id === levelId) ?? -1;
  const nextLevel = currentLevelIndex >= 0 ? currentIsland?.levels[currentLevelIndex + 1] : undefined;
  const completionAction = isCompleted && !displayedSlide.nextSlideId
    ? nextLevel && nextLevel.availability !== 'blocked'
      ? {
          label: 'Ir para o próximo nível',
          onAction: () => {
            if (nextLevel.progress) {
              navigateRoute(slidePath(nextLevel.progress.currentSlideId));
              return;
            }
            setCommandError(null);
            start.mutate(nextLevel.id, {
              onSuccess: (nextSnapshot) => {
                const started = selectLevelProgress(nextSnapshot, nextLevel.id);
                if (started?.progress) navigateRoute(`/ilhas/${slug}/niveis/${nextLevel.id}/slides/${started.progress.currentSlideId}`);
              },
              onError: (error) => setCommandError(error instanceof ApiClientError ? error : null),
            });
          },
        }
      : !nextLevel
        ? { label: 'Voltar ao catálogo', onAction: () => navigateRoute('/ilhas') }
        : undefined
    : undefined;

  return (
    <PageContainer width="reader" className="py-8 sm:py-12">
      <Button asChild variant="ghost" size="sm" className="mb-6">
        <Link to={`/ilhas/${slug}`}><ArrowLeft aria-hidden="true" /> Voltar à ilha</Link>
      </Button>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Nível {level.data.position}</p>
          <p className="mt-1 text-sm text-muted-foreground">{level.data.title}</p>
        </div>
        <Badge variant={isCompleted ? 'secondary' : 'default'}>{isCompleted ? 'Revisão' : 'Em andamento'}</Badge>
      </div>
      <Progress value={displayedSlide.position} max={level.data.slides.length} aria-label={`Slide ${displayedSlide.position} de ${level.data.slides.length}`} />
      <p className="mt-2 text-right text-xs text-muted-foreground">Slide {displayedSlide.position} de {level.data.slides.length}</p>
      {commandError && <FeedbackAlert focusRef={alertRef} className="mt-5" kind="error" title="Progresso não alterado" description={domainErrorMessage(commandError.code)} requestId={commandError.requestId} />}
      {completedMessage && <FeedbackAlert className="mt-5" kind="success" title="Nível concluído" description="Conclusão registrada. Escolha a próxima ação abaixo." />}
      <Card className="mt-6 min-h-[28rem]">
        <CardHeader>
          <h1 ref={headingRef} tabIndex={-1} className="text-balance text-3xl font-bold tracking-tight outline-none sm:text-4xl">{displayedSlide.title}</h1>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between gap-10">
          <SlideRenderer slide={displayedSlide} />
          <div aria-live="polite" className="min-h-5 text-sm text-muted-foreground">{isCommandPending ? 'Salvando progresso…' : ''}</div>
          <SlideNavigation
            hasPrevious={Boolean(displayedSlide.previousSlideId)}
            hasNext={Boolean(displayedSlide.nextSlideId)}
            canComplete={canComplete}
            isCompleted={isCompleted}
            isPending={isCommandPending}
            completionAction={completionAction}
            onPrevious={() => displayedSlide.previousSlideId && persistAndOpen(displayedSlide.previousSlideId)}
            onNext={() => displayedSlide.nextSlideId && persistAndOpen(displayedSlide.nextSlideId)}
            onComplete={() => complete.mutate(levelId, {
              onSuccess: () => { setCommandError(null); setCompletedMessage(true); },
              onError: (error) => setCommandError(error instanceof ApiClientError ? error : null),
            })}
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
