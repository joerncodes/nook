import {
  fetchImmichAssets,
  fetchImmichStatistics,
  type ImmichAsset,
  type ImmichSource,
  type ImmichStatistics,
} from "@/lib/immich";
import { ImmichCarousel } from "./immich-carousel";
import { WidgetStat } from "./shared";

type Props = {
  baseUrl: string;
  apiKey: string;
  favorites?: boolean;
  albumId?: string;
  limit?: number;
  autoRotate?: boolean;
  orientation?: "landscape" | "portrait";
  stats?: boolean;
};

function resolveSource(p: Props): ImmichSource | { error: string } {
  if (p.albumId) return { kind: "album", albumId: p.albumId };
  if (p.favorites) return { kind: "favorites" };
  return { error: "set `favorites: true` or `albumId: <id>`" };
}

function formatGb(bytes: number): string {
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

function renderMedia(baseUrl: string, assets: ImmichAsset[], autoRotate: boolean) {
  if (assets.length === 0) {
    return <p className="immich-empty">No photos yet.</p>;
  }
  if (assets.length > 1) {
    return <ImmichCarousel baseUrl={baseUrl} assets={assets} autoRotate={autoRotate} />;
  }
  const a = assets[0];
  const ratio = a.width && a.height ? `${a.width} / ${a.height}` : "3 / 2";
  return (
    <a
      href={`${baseUrl.replace(/\/$/, "")}/photos/${a.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="immich-single"
      title={a.originalFileName ?? ""}
      style={{ aspectRatio: ratio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="immich-thumb"
        src={`/api/immich/${a.id}/thumb`}
        alt=""
        loading="lazy"
      />
    </a>
  );
}

export async function ImmichWidget({
  baseUrl,
  apiKey,
  favorites = false,
  albumId,
  limit = 6,
  autoRotate = true,
  orientation,
  stats: showStats = true,
}: Props) {
  const source = resolveSource({ baseUrl, apiKey, favorites, albumId, limit });
  if ("error" in source) {
    return <div className="text-sm text-destructive">Immich: {source.error}</div>;
  }

  let assets: ImmichAsset[] = [];
  let stats: ImmichStatistics | null = null;
  let error: string | null = null;
  try {
    const assetsP = fetchImmichAssets({ baseUrl, apiKey, source, limit, orientation });
    const statsP = showStats
      ? fetchImmichStatistics({ baseUrl, apiKey })
      : Promise.resolve(null);
    [assets, stats] = await Promise.all([assetsP, statsP]);
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return <div className="text-sm text-destructive">Immich: {error}</div>;
  }

  return (
    <div className="immich">
      {renderMedia(baseUrl, assets, autoRotate)}
      {showStats && stats && (
        <dl className="widget-counts">
          <WidgetStat label="Photos" value={stats.photos} />
          <WidgetStat label="Videos" value={stats.videos} />
          <WidgetStat label="Storage" value={formatGb(stats.usage)} />
        </dl>
      )}
    </div>
  );
}
