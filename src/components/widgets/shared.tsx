import type { ReactNode } from "react";

const numberFormatter = new Intl.NumberFormat("en-US");

export function WidgetStat({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="widget-stat">
      <dt className="widget-stat-label">{label}</dt>
      <dd className="widget-stat-value">
        {typeof value === "number" ? numberFormatter.format(value) : value}
      </dd>
    </div>
  );
}

type ListItemProps = {
  href: string;
  title: ReactNode;
  meta?: ReactNode;
  leading?: ReactNode;
  dataAttrs?: Record<string, string | number | undefined>;
};

export function WidgetListItem({
  href,
  title,
  meta,
  leading,
  dataAttrs,
}: ListItemProps) {
  return (
    <li className="widget-list-item" {...dataAttrs}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="widget-list-link"
      >
        {leading && <span className="widget-list-leading">{leading}</span>}
        <span className="widget-list-main">
          <span className="widget-list-content">{title}</span>
          {meta && <span className="widget-list-meta">{meta}</span>}
        </span>
      </a>
    </li>
  );
}
