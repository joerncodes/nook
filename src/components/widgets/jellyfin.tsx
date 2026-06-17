import { connection } from "next/server";
import { fetchJellyfinSummary, type JellyfinSummary } from "@/lib/jellyfin";
import { WidgetStat } from "./shared";

type Props = {
  title?: string;
  baseUrl: string;
  apiKey: string;
  userId: string;
};

export async function JellyfinWidget({ title, baseUrl, apiKey, userId }: Props) {
  let summary: JellyfinSummary | null = null;
  let error: string | null = null;
  try {
    summary = await fetchJellyfinSummary({ baseUrl, apiKey, userId });
  } catch (err) {
    error = err instanceof Error ? err.message : "failed to fetch";
  }

  if (error) {
    return <div className="text-sm text-destructive">Jellyfin: {error}</div>;
  }
  if (!summary) return null;

  const { movieCount, episodeCount, latest } = summary;
  const webBase = baseUrl.replace(/\/$/, "");
  const homeHref = `${webBase}/web/index.html`;

  await connection();
  const pick =
    latest.length > 0
      ? latest[Math.floor(Math.random() * latest.length)]
      : null;
  const pickHref = pick
    ? `${webBase}/web/index.html#!/details?id=${pick.id}`
    : null;

  return (
    <div className="jellyfin">
      {title && (
        <div className="jellyfin-header">
          <a
            className="widget-title jellyfin-title-link"
            href={homeHref}
            target="_blank"
            rel="noopener noreferrer"
          >
            {title}
          </a>
        </div>
      )}

      {pick && pickHref && (
        <a
          className="jellyfin-latest"
          href={pickHref}
          target="_blank"
          rel="noopener noreferrer"
          title={pick.name}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="jellyfin-poster"
            src={`/api/jellyfin/${pick.id}/poster`}
            alt=""
            loading="lazy"
          />
          <div className="jellyfin-caption">
            <span className="jellyfin-caption-title">{pick.name}</span>
            {pick.productionYear && (
              <span className="jellyfin-caption-year">
                {pick.productionYear}
              </span>
            )}
          </div>
        </a>
      )}

      <dl className="widget-counts">
        <WidgetStat label="Movies" value={movieCount} />
        <WidgetStat label="Episodes" value={episodeCount} />
      </dl>
    </div>
  );
}
