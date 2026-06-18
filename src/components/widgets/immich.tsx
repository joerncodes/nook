import {
  fetchImmichAssets,
  fetchImmichStatistics,
  formatPhotoDate,
  type ImmichAsset,
  type ImmichSource,
  type ImmichStatistics,
} from "@/lib/immich";
import { ImmichCarousel } from "./immich-carousel";
import { WidgetStat } from "./shared";

type ImmichMode = "favorites" | "onThisDay" | "album";

type Props = {
  baseUrl: string;
  apiKey: string;
  mode?: ImmichMode;
  albumId?: string;
  limit?: number;
  autoRotate?: boolean;
  orientation?: "landscape" | "portrait";
  stats?: boolean;
  metadata?: boolean;
};

function ImmichCaption({ asset }: { asset: ImmichAsset }) {
  const date = formatPhotoDate(asset.localDateTime);
  const people = asset.people ?? [];
  if (!date && people.length === 0) return null;
  return (
    <div className="immich-caption">
      {date && <span className="immich-date">{date}</span>}
      {people.length > 0 && (
        <span className="immich-people">{people.join(", ")}</span>
      )}
    </div>
  );
}

function resolveSource(p: Props): ImmichSource | { error: string } {
  switch (p.mode) {
    case "album":
      if (!p.albumId) return { error: "mode `album` requires `albumId`" };
      return { kind: "album", albumId: p.albumId };
    case "onThisDay":
      return { kind: "onThisDay" };
    case "favorites":
    default:
      return { kind: "favorites" };
  }
}

function formatGb(bytes: number): string {
  return `${(bytes / 1e9).toFixed(1)} GB`;
}

function renderMedia(
  baseUrl: string,
  assets: ImmichAsset[],
  autoRotate: boolean,
  emptyLabel: string,
  metadata: boolean,
) {
  if (assets.length === 0) {
    return <p className="immich-empty">{emptyLabel}</p>;
  }
  if (assets.length > 1) {
    return (
      <ImmichCarousel
        baseUrl={baseUrl}
        assets={assets}
        autoRotate={autoRotate}
        showMeta={metadata}
      />
    );
  }
  const a = assets[0];
  const ratio = a.width && a.height ? `${a.width} / ${a.height}` : "3 / 2";
  return (
    <div className="immich-figure">
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
      {metadata && <ImmichCaption asset={a} />}
    </div>
  );
}

export async function ImmichWidget({
  baseUrl,
  apiKey,
  mode = "favorites",
  albumId,
  limit = 6,
  autoRotate = true,
  orientation,
  stats: showStats = true,
  metadata = false,
}: Props) {
  const source = resolveSource({ baseUrl, apiKey, mode, albumId, limit });
  if ("error" in source) {
    return <div className="text-sm text-destructive">Immich: {source.error}</div>;
  }
  const emptyLabel =
    source.kind === "onThisDay" ? "No memories for today." : "No photos yet.";

  let assets: ImmichAsset[] = [];
  let stats: ImmichStatistics | null = null;
  let error: string | null = null;
  try {
    const assetsP = fetchImmichAssets({
      baseUrl,
      apiKey,
      source,
      limit,
      orientation,
      withMetadata: metadata,
    });
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
      {renderMedia(baseUrl, assets, autoRotate, emptyLabel, metadata)}
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
