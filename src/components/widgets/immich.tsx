import {
  fetchImmichAssets,
  type ImmichAsset,
  type ImmichSource,
} from "@/lib/immich";
import { ImmichCarousel } from "./immich-carousel";

type Props = {
  baseUrl: string;
  apiKey: string;
  favorites?: boolean;
  albumId?: string;
  limit?: number;
};

function resolveSource(p: Props): ImmichSource | { error: string } {
  if (p.albumId) return { kind: "album", albumId: p.albumId };
  if (p.favorites) return { kind: "favorites" };
  return { error: "set `favorites: true` or `albumId: <id>`" };
}

export async function ImmichWidget({
  baseUrl,
  apiKey,
  favorites = false,
  albumId,
  limit = 6,
}: Props) {
  const source = resolveSource({ baseUrl, apiKey, favorites, albumId, limit });
  if ("error" in source) {
    return <div className="text-sm text-destructive">Immich: {source.error}</div>;
  }

  let assets: ImmichAsset[] = [];
  let error: string | null = null;
  try {
    assets = await fetchImmichAssets({ baseUrl, apiKey, source, limit });
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return <div className="text-sm text-destructive">Immich: {error}</div>;
  }
  if (assets.length === 0) {
    return <p className="immich-empty">No photos yet.</p>;
  }

  if (assets.length > 1) {
    return <ImmichCarousel baseUrl={baseUrl} assets={assets} />;
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
