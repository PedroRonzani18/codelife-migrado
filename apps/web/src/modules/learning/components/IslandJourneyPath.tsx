import { ArrowRight, BookOpen, Braces, CheckCircle2, Flag, LockKeyhole, MousePointerClick, Orbit, PanelsTopLeft, Play, RotateCcw, Sparkles } from 'lucide-react';
import type { LevelAvailability } from '@codelife/contracts/learning';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import type { LevelJourney } from '../selectors/selectLearning';

const stateCopy: Record<LevelAvailability, { label: string; description: string }> = {
  available: { label: 'Próxima etapa', description: 'Tudo pronto para começar.' },
  in_progress: { label: 'Você está aqui', description: 'Continue do último slide salvo.' },
  blocked: { label: 'Em breve', description: 'Conclua a etapa anterior para liberar.' },
  completed: { label: 'Concluída', description: 'Conteúdo disponível para revisão.' },
};

const levelIcons = [Braces, MousePointerClick, PanelsTopLeft];

function actionLabel(availability: LevelAvailability) {
  if (availability === 'available') return 'Começar etapa';
  if (availability === 'in_progress') return 'Continuar jornada';
  return 'Revisar etapa';
}

export function IslandJourneyPath({
  title,
  levels,
  isPending,
  onOpenLevel,
}: {
  title: string;
  levels: LevelJourney[];
  isPending: boolean;
  onOpenLevel: (levelId: string) => void;
}) {
  const completed = levels.filter((level) => level.availability === 'completed').length;
  const currentLevel = levels.find((level) => level.availability === 'in_progress' || level.availability === 'available');
  const isComplete = levels.length > 0 && completed === levels.length;
  const progressLabel = isComplete ? 'Ilha concluída' : `${completed} de ${levels.length} etapas concluídas`;

  return (
    <>
      <header className="relative overflow-hidden rounded-3xl border border-primary/25 bg-[radial-gradient(circle_at_top_right,oklch(0.69_0.17_259_/_0.20),transparent_42%),linear-gradient(135deg,oklch(0.19_0.035_264),oklch(0.16_0.03_264))] px-6 py-8 shadow-2xl shadow-primary/5 sm:px-10 sm:py-11">
        <div aria-hidden="true" className="absolute -right-12 -top-16 size-56 rounded-full border border-primary/20" />
        <div aria-hidden="true" className="absolute right-20 top-14 size-24 rounded-full bg-primary/10 blur-2xl" />
        <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-5 flex size-14 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-lg shadow-primary/10">
              <Orbit className="size-7" aria-hidden="true" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Sua próxima ilha</p>
            <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight sm:text-6xl">{title}</h1>
            <p className="mt-4 max-w-xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
              {isComplete ? 'Você percorreu todas as etapas desta ilha. Volte quando quiser revisar os conceitos.' : 'Faça as páginas responderem às pessoas: variáveis, eventos e alterações visíveis no DOM.'}
            </p>
          </div>
          <div className="flex min-w-44 flex-col gap-2 rounded-2xl border border-border/80 bg-background/45 p-4 backdrop-blur-sm">
            <span className="flex items-center gap-2 text-sm font-semibold">
              {isComplete ? <Flag className="size-4 text-emerald-300" aria-hidden="true" /> : <Sparkles className="size-4 text-primary" aria-hidden="true" />}
              {isComplete ? 'Missão concluída' : 'Em exploração'}
            </span>
            <span className="text-xs leading-5 text-muted-foreground">{currentLevel ? `Foco: ${currentLevel.title}` : 'Todas as etapas estão disponíveis para revisão.'}</span>
          </div>
        </div>
        <div className="relative mt-9 max-w-3xl rounded-2xl border border-border/70 bg-background/40 p-4 backdrop-blur-sm">
          <div className="mb-3 flex items-center justify-between gap-4 text-sm">
            <span className="flex items-center gap-2 font-semibold"><BookOpen className="size-4 text-primary" aria-hidden="true" /> Progresso da jornada</span>
            <span className="font-medium text-muted-foreground">{progressLabel}</span>
          </div>
          <Progress value={completed} max={Math.max(levels.length, 1)} className="h-2.5 bg-primary/15" aria-label={progressLabel} />
        </div>
      </header>

      <section aria-labelledby="learning-path-title" className="mt-10">
        <div className="mb-8 flex items-end justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Percurso da ilha</p>
            <h2 id="learning-path-title" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">Escolha seu próximo marco</h2>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">As etapas são liberadas em sequência.</span>
        </div>

        <ol className="mx-auto max-w-5xl">
          {levels.map((level, index) => {
            const Icon = levelIcons[index % levelIcons.length];
            const copy = stateCopy[level.availability];
            const isBlocked = level.availability === 'blocked';
            const isCompleted = level.availability === 'completed';
            const isCurrent = level.availability === 'in_progress' || level.availability === 'available';
            const actionIcon = isCompleted ? RotateCcw : isCurrent ? Play : LockKeyhole;
            const ActionIcon = actionIcon;

            return (
              <li key={level.id} className="relative grid grid-cols-[3rem_minmax(0,1fr)] gap-x-4 pb-8 last:pb-0 md:grid-cols-[minmax(0,1fr)_5rem_minmax(0,1fr)] md:gap-x-7">
                {index < levels.length - 1 && <div aria-hidden="true" className={cn('absolute bottom-0 left-6 top-12 w-px md:left-1/2 md:-translate-x-1/2', isCompleted ? 'bg-emerald-400/55' : 'bg-border')} />}
                <div className={cn('relative z-10 col-start-1 row-start-1 flex size-12 items-center justify-center rounded-2xl border shadow-lg md:col-start-2 md:justify-self-center', isCompleted && 'border-emerald-400/60 bg-emerald-400/15 text-emerald-200', isCurrent && 'border-primary/70 bg-primary text-primary-foreground shadow-primary/25', isBlocked && 'border-border bg-muted text-muted-foreground')}>
                  {isCompleted ? <CheckCircle2 className="size-6" aria-hidden="true" /> : isBlocked ? <LockKeyhole className="size-5" aria-hidden="true" /> : <Icon className="size-6" aria-hidden="true" />}
                </div>
                <article className={cn('col-start-2 row-start-1 rounded-2xl border p-5 transition-colors md:row-start-1', index % 2 === 0 ? 'md:col-start-1' : 'md:col-start-3', isCompleted && 'border-emerald-400/35 bg-emerald-400/5', isCurrent && 'border-primary/55 bg-gradient-to-br from-primary/15 to-card shadow-xl shadow-primary/5', isBlocked && 'border-border/70 bg-muted/25 text-muted-foreground')}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className={cn('text-xs font-bold uppercase tracking-[0.18em]', isCurrent ? 'text-primary' : isCompleted ? 'text-emerald-300' : 'text-muted-foreground')}>{copy.label}</p>
                      <h3 className="mt-2 text-xl font-bold tracking-tight text-foreground">{level.title}</h3>
                    </div>
                    <span className="rounded-full border border-border/80 bg-background/45 px-2.5 py-1 text-xs font-semibold text-muted-foreground">Etapa {level.position}</span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{copy.description}</p>
                  <div className="mt-5">
                    {isBlocked ? (
                      <span className="inline-flex min-h-9 items-center gap-2 text-sm font-medium text-muted-foreground"><LockKeyhole className="size-4" aria-hidden="true" /> Aguarde a etapa anterior</span>
                    ) : (
                      <Button type="button" variant={isCompleted ? 'outline' : 'default'} className="w-full sm:w-auto" disabled={isPending} onClick={() => onOpenLevel(level.id)}>
                        <ActionIcon aria-hidden="true" /> {isPending ? 'Preparando…' : actionLabel(level.availability)}
                        {!isCompleted && <ArrowRight aria-hidden="true" />}
                      </Button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
