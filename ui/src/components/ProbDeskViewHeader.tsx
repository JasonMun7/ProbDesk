type Props = {
  title: string;
  subtitle: string;
};

export function ProbDeskViewHeader({ title, subtitle }: Props) {
  return (
    <header className="shrink-0 border-b border-pd-border bg-pd-white/80 px-6 py-4 backdrop-blur">
      <h2 className="text-xl font-semibold text-pd-ink">{title}</h2>
      <p className="mt-0.5 text-xs text-pd-ink/55">{subtitle}</p>
    </header>
  );
}
