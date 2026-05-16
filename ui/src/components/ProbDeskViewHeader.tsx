type Props = {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
};

export function ProbDeskViewHeader({ title, subtitle, action }: Props) {
  return (
    <header className="shrink-0 border-b border-pd-border bg-pd-white/80 px-6 py-4 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-pd-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-pd-ink/55">{subtitle}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
    </header>
  );
}
