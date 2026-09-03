type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  as?: "h1" | "h2" | "h3";
  actions?: React.ReactNode;
};

export function SectionHeader({
  title,
  subtitle,
  as: Tag = "h2",
  actions,
}: SectionHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <Tag
          className={
            Tag === "h1"
              ? "text-2xl font-bold text-ink sm:text-3xl"
              : "text-xl font-bold text-ink"
          }
        >
          {title}
        </Tag>

        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}

export default SectionHeader;
