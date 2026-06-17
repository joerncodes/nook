type Item = { title: string; url: string; icon?: string };

type Props = {
  items: Item[];
  columns?: number;
};

function favicon(url: string): string | null {
  try {
    const host = new URL(url).hostname;
    return `https://icons.duckduckgo.com/ip3/${host}.ico`;
  } catch {
    return null;
  }
}

export function LinksWidget({ items, columns = 1 }: Props) {
  const gridCols =
    columns === 4
      ? "grid-cols-4"
      : columns === 3
        ? "grid-cols-3"
        : columns === 2
          ? "grid-cols-2"
          : "grid-cols-1";

  return (
    <ul className={`grid ${gridCols} gap-1`}>
      {items.map((it) => {
        const icon = it.icon ?? favicon(it.url);
        return (
          <li key={it.url}>
            <a
              href={it.url}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {icon && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={icon}
                  alt=""
                  className="h-4 w-4 shrink-0 rounded-sm"
                  loading="lazy"
                />
              )}
              <span className="truncate">{it.title}</span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
