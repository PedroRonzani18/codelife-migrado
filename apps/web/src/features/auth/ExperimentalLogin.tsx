type Props = { onLogin: () => void; isPending: boolean; error?: string };
export function ExperimentalLogin({ onLogin, isPending, error }: Props) {
  return <section className="panel" aria-labelledby="experimental-login-title">
    <p className="eyebrow">Ambiente controlado</p>
    <h2 id="experimental-login-title">Sessão experimental</h2>
    <p>Use a única pessoa versionada na fixture: <code>aluna.demo</code>. Não há cadastro, senha ou escolha de identificador.</p>
    <button type="button" onClick={onLogin} disabled={isPending}>{isPending ? 'Iniciando…' : 'Iniciar sessão experimental'}</button>
    {error && <p role="alert">{error}</p>}
  </section>;
}
