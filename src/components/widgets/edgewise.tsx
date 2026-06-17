import {
  fetchEdgewiseKnives,
  fetchEdgewiseOwners,
  summarize,
  type EdgewiseKnife,
  type EdgewiseOwner,
} from "@/lib/edgewise";
import { WidgetListItem, WidgetStat } from "./shared";

type Props = {
  baseUrl: string;
  token: string;
  limit?: number;
};

function knifeHref(baseUrl: string, knife: EdgewiseKnife): string {
  return `${baseUrl.replace(/\/$/, "")}/knives/${encodeURIComponent(knife.id)}`;
}

function heroImageSrc(knife: EdgewiseKnife): string | null {
  const first = knife.images?.[0];
  if (!first) return null;
  return `/api/edgewise/${encodeURIComponent(knife.id)}/${encodeURIComponent(
    first.filename,
  )}`;
}

function ownerName(
  knife: EdgewiseKnife,
  owners: Map<string, EdgewiseOwner>,
): string | undefined {
  if (!knife.ownerId) return undefined;
  return owners.get(knife.ownerId)?.name ?? knife.ownerId;
}

export async function EdgewiseWidget({ baseUrl, token, limit = 5 }: Props) {
  let knives: EdgewiseKnife[] = [];
  let owners: EdgewiseOwner[] = [];
  let error: string | null = null;
  try {
    [knives, owners] = await Promise.all([
      fetchEdgewiseKnives({ baseUrl, token }),
      fetchEdgewiseOwners({ baseUrl, token }),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return <div className="text-sm text-destructive">Edgewise: {error}</div>;
  }

  const summary = summarize(knives);
  const ownerMap = new Map(owners.map((o) => [o.id, o]));
  const queue = summary.backlogQueue.slice(0, limit);
  const hero = queue[0];
  const rest = queue.slice(1);
  const heroSrc = hero ? heroImageSrc(hero) : null;
  const heroOwner = hero ? ownerName(hero, ownerMap) : undefined;

  return (
    <div className="edgewise">
      {!hero ? (
        <p className="widget-empty">Backlog clear.</p>
      ) : (
        <>
          <a
            href={knifeHref(baseUrl, hero)}
            target="_blank"
            rel="noopener noreferrer"
            className="edgewise-hero"
            title={hero.name}
          >
            {heroSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="edgewise-hero-image"
                src={heroSrc}
                alt=""
                loading="lazy"
              />
            ) : (
              <span className="edgewise-hero-fallback" aria-hidden="true">
                {hero.name.slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="edgewise-hero-caption">
              <span className="edgewise-position">#1</span>
              <span className="edgewise-hero-name">{hero.name}</span>
              {heroOwner && (
                <span className="edgewise-hero-owner">{heroOwner}</span>
              )}
            </div>
          </a>

          {rest.length > 0 && (
            <ul className="widget-list">
              {rest.map((k, i) => (
                <WidgetListItem
                  key={k.id}
                  href={knifeHref(baseUrl, k)}
                  leading={`#${i + 2}`}
                  title={k.name}
                  meta={ownerName(k, ownerMap)}
                />
              ))}
            </ul>
          )}
        </>
      )}

      <dl className="widget-counts">
        <WidgetStat label="Total" value={summary.total} />
        <WidgetStat label="Backlog" value={summary.backlog} />
        <WidgetStat label="On loan" value={summary.onLoan} />
      </dl>
    </div>
  );
}
