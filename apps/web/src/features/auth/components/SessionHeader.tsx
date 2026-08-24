import { LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import type { AuthSession } from '@codelife/contracts/auth';

export function SessionHeader({ session, onLogout, isPending }: { session: AuthSession; onLogout: () => void; isPending: boolean }) {
  return (
    <header className="border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4">
        <Link to="/ilhas/island-3" className="font-bold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          CodeLife <span className="text-primary">experimental</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            Olá, <strong className="text-foreground">{session.user.displayName}</strong>
          </span>
          <Button type="button" variant="ghost" size="sm" onClick={onLogout} disabled={isPending}>
            <LogOut aria-hidden="true" />
            {isPending ? 'Saindo…' : 'Sair'}
          </Button>
        </div>
      </div>
    </header>
  );
}
