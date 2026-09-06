import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FeedbackAlert, PageContainer } from '@/shared/components';

type Props = { onLogin: () => void };

export function GoogleLogin({ onLogin }: Props) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string>();

  function handleLogin() {
    setIsPending(true);
    setError(undefined);

    try {
      onLogin();
    } catch (cause) {
      setIsPending(false);
      setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a autenticação.');
    }
  }

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
        <Card aria-labelledby="google-login-title" className="border-primary/20 bg-card/90 shadow-2xl shadow-primary/5">
          <CardHeader>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Acesso seguro</p>
            <CardTitle id="google-login-title" className="text-2xl">Entrar com Google</CardTitle>
            <CardDescription className="leading-6">
              Use sua conta Google para acessar a jornada e continuar seu progresso.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button type="button" size="lg" className="w-full" onClick={handleLogin} disabled={isPending} aria-busy={isPending}>
              <LogIn aria-hidden="true" />
              {isPending ? 'Redirecionando…' : 'Entrar com Google'}
            </Button>
            {error && <FeedbackAlert kind="error" title="Não foi possível iniciar" description={error} />}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
