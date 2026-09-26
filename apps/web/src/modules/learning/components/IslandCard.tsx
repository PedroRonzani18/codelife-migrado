import { ArrowRight, CheckCircle2, Lock, Play, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import type { IslandCatalogItem } from "@codelife/contracts/learning";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

export type IslandCardProps = {
  island: IslandCatalogItem;
};

export function IslandCard({ island }: IslandCardProps) {
  const { slug, title, position, levelCount, availability } = island;

  const isBlocked = availability === "blocked";
  const isCompleted = availability === "completed";
  const isInProgress = availability === "in_progress";
  const isAvailable = availability === "available";

  return (
    <Card
      className={`flex flex-col justify-between transition-all ${
        isBlocked
          ? "border-border/50 bg-card/50 opacity-80"
          : "border-border shadow-xs hover:border-primary/50 hover:shadow-md"
      }`}
    >
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Ilha {position}
          </span>
          {isCompleted && (
            <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
              Concluída
            </Badge>
          )}
          {isInProgress && (
            <Badge variant="default" className="gap-1 bg-amber-500 hover:bg-amber-600 text-white">
              Em andamento
            </Badge>
          )}
          {isAvailable && (
            <Badge variant="default" className="gap-1">
              Disponível
            </Badge>
          )}
          {isBlocked && (
            <Badge variant="outline" className="gap-1 text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Bloqueada
            </Badge>
          )}
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="text-xs text-muted-foreground">
          {levelCount} {levelCount === 1 ? "nível" : "níveis"} de aprendizado
        </p>
      </CardHeader>

      <CardContent className="pb-4">
        <p className="text-sm text-muted-foreground">
          {isCompleted && "Você concluiu todos os níveis desta ilha. Você pode revisitar o conteúdo a qualquer momento."}
          {isInProgress && "Você já iniciou esta ilha. Continue os níveis de onde parou."}
          {isAvailable && "Pronta para iniciar! Explore os conceitos práticos desta ilha."}
          {isBlocked && "Conclua a ilha anterior para desbloquear esta etapa da jornada."}
        </p>
      </CardContent>

      <CardFooter className="pt-0">
        {isBlocked ? (
          <Button disabled variant="outline" className="w-full gap-2 text-xs">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
            Ilha Bloqueada
          </Button>
        ) : isCompleted ? (
          <Button asChild variant="outline" className="w-full gap-2 text-xs">
            <Link to={`/ilhas/${slug}`}>
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Revisitar ilha
            </Link>
          </Button>
        ) : isInProgress ? (
          <Button asChild variant="default" className="w-full gap-2 text-xs">
            <Link to={`/ilhas/${slug}`}>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              Continuar ilha
            </Link>
          </Button>
        ) : (
          <Button asChild variant="default" className="w-full gap-2 text-xs">
            <Link to={`/ilhas/${slug}`}>
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Começar ilha
            </Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
