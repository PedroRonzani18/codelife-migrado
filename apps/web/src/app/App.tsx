import { QueryClient, QueryClientProvider, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiClientError } from '@/api/client';
import { getSession, logout, startExperimentalSession } from '@/api/auth';
import { getExperimentalIsland } from '@/api/learning';
import { ExperimentalLogin } from '@/features/auth/ExperimentalLogin';
import { IslandFoundation } from '@/modules/learning/IslandFoundation';

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });

function Shell() {
  const queryClient = useQueryClient();
  const session = useQuery({ queryKey: ['session'], queryFn: getSession });
  const login = useMutation({ mutationFn: startExperimentalSession, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['session'] }) });
  const leave = useMutation({ mutationFn: logout, onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['session'] }) });
  const island = useQuery({ queryKey: ['island-3'], queryFn: getExperimentalIsland, enabled: Boolean(session.data) });
  const hasNoSession = (session.error instanceof ApiClientError || (typeof session.error === 'object' && session.error !== null && 'status' in session.error)) && (session.error as { status?: number }).status === 401;

  return <main className="shell">
    <header><p className="eyebrow">CodeLife · recorte TCC</p><h1>Fundação modernizada</h1><p>Estrutura executável para a fatia experimental <code>island-3</code>.</p></header>
    {session.isLoading && <p>Verificando sessão…</p>}
    {hasNoSession && <ExperimentalLogin onLogin={() => login.mutate()} isPending={login.isPending} error={login.error?.message} />}
    {session.data && <>
      <section className="session"><span>Sessão ativa: <strong>{session.data.user.displayName}</strong> (<code>{session.data.user.username}</code>)</span><button className="secondary" type="button" onClick={() => leave.mutate()} disabled={leave.isPending}>Encerrar sessão</button></section>
      {island.isLoading && <p>Carregando a fixture…</p>}
      {island.error && <p role="alert">Não foi possível consultar a fixture: {island.error.message}</p>}
      {island.data && <IslandFoundation island={island.data} />}
    </>}
    {!session.isLoading && !hasNoSession && session.error && <p role="alert">Não foi possível verificar a sessão: {session.error.message}</p>}
  </main>;
}

export function App() { return <QueryClientProvider client={client}><Shell /></QueryClientProvider>; }
