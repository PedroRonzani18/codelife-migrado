import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackAlert, PageContainer } from '@/shared/components';

type Props = { onLogin: () => void; isPending: boolean; error?: string; requestId?: string };
export function ExperimentalLogin({ onLogin, isPending, error, requestId }: Props) {
  return (
    <PageContainer width="reader" className="flex min-h-screen items-center py-12">
      <div className="grid w-full gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <header className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">CodeLife · recorte TCC</p>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">Aprenda interatividade passo a passo.</h1>
          <p className="max-w-xl text-lg leading-8 text-muted-foreground">
            Uma jornada controlada por três níveis, com progresso persistido e retomada segura.
          </p>
        </header>
        <Card aria-labelledby="experimental-login-title" className="border-primary/20 bg-card/90 shadow-2xl shadow-primary/5">
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Ambiente controlado</p>
            <CardTitle id="experimental-login-title" className="text-2xl">Sessão experimental</CardTitle>
            <CardDescription className="leading-6">
              Use a pessoa versionada <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">aluna.demo</code>. Não há cadastro, senha ou escolha de identificador.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" size="lg" className="w-full" onClick={onLogin} disabled={isPending}>
              <LogIn aria-hidden="true" />
              {isPending ? 'Iniciando…' : 'Iniciar sessão experimental'}
            </Button>
            {error && <FeedbackAlert kind="error" title="Não foi possível iniciar" description={error} requestId={requestId} />}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
