export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <header className="space-y-3">
      <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
      <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground sm:text-5xl">{title}</h1>
      {description && <p className="max-w-2xl text-pretty text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>}
    </header>
  );
}
