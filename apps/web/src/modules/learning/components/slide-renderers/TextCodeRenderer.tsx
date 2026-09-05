import type { TextCodeSlide } from '@codelife/contracts/learning';

export function TextCodeRenderer({ slide }: { slide: TextCodeSlide }) {
  return (
    <div className="space-y-6">
      <p className="text-lg leading-8 text-muted-foreground">{slide.text}</p>
      <div className="overflow-hidden rounded-xl border border-border bg-slate-950 shadow-inner">
        <div className="border-b border-slate-800 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400">{slide.language}</div>
        <pre className="overflow-x-auto p-5 text-sm leading-7 text-slate-100"><code>{slide.code}</code></pre>
      </div>
    </div>
  );
}
