export type ImmichAsset = {
  id: string;
  originalFileName?: string;
  fileCreatedAt?: string;
  /** When the photo was taken (timezone-agnostic), used for the caption. */
  localDateTime?: string;
  width?: number;
  height?: number;
  /** Recognised, non-hidden people; undefined when not enriched. */
  people?: string[];
};

/** Human date for a photo, e.g. "12 Jun 2019". Pure — safe on client too. */
export function formatPhotoDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

type MetadataSearchBody = {
  isFavorite?: boolean;
  albumIds?: string[];
  size: number;
  type?: "IMAGE" | "VIDEO";
  order?: "asc" | "desc";
  withExif?: boolean;
};

type SearchResponse = {
  assets: {
    items: ImmichAsset[];
    count: number;
    total: number;
    nextPage: string | null;
  };
};

// Memory/detail assets carry dimensions + date under exifInfo, and people as
// objects rather than the flattened shapes ImmichAsset exposes.
type RawAsset = Omit<ImmichAsset, "people"> & {
  exifInfo?: {
    exifImageWidth?: number | null;
    exifImageHeight?: number | null;
    dateTimeOriginal?: string | null;
  };
  people?: { name?: string | null; isHidden?: boolean }[];
};

type MemoryResponse = {
  id: string;
  type: string;
  data?: { year?: number };
  assets?: RawAsset[];
};

export type ImmichSource =
  | { kind: "favorites" }
  | { kind: "onThisDay" }
  | { kind: "album"; albumId: string };

export type ImmichOrientation = "landscape" | "portrait";

function matchesOrientation(a: ImmichAsset, want: ImmichOrientation): boolean {
  if (!a.width || !a.height) return false;
  return want === "landscape" ? a.width > a.height : a.height > a.width;
}

function normalizeAsset(a: RawAsset): ImmichAsset {
  const people = a.people
    ?.filter((p) => p && p.name && !p.isHidden)
    .map((p) => p.name as string);
  return {
    id: a.id,
    originalFileName: a.originalFileName,
    fileCreatedAt: a.fileCreatedAt,
    localDateTime: a.localDateTime ?? a.exifInfo?.dateTimeOriginal ?? a.fileCreatedAt,
    width: a.width ?? a.exifInfo?.exifImageWidth ?? undefined,
    height: a.height ?? a.exifInfo?.exifImageHeight ?? undefined,
    people: people && people.length ? people : undefined,
  };
}

// Per-asset detail — the only response that reliably populates `people`
// (face recognition) and full EXIF. Used to enrich displayed assets when the
// metadata caption is enabled.
async function fetchImmichAssetDetail(
  baseUrl: string,
  apiKey: string,
  id: string,
): Promise<ImmichAsset | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/assets/${id}`;
  const res = await fetch(url, {
    headers: { "x-api-key": apiKey, accept: "application/json" },
    next: { revalidate: 600, tags: ["immich-assets"] },
  });
  if (!res.ok) return null;
  return normalizeAsset((await res.json()) as RawAsset);
}

// "On this day" — Immich's memory lanes for the current calendar day across
// previous years. We pin `for` to local midnight so the URL (and thus the
// fetch cache key) is stable for the whole day.
async function fetchOnThisDay(
  baseUrl: string,
  apiKey: string,
): Promise<ImmichAsset[]> {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  const url = `${baseUrl.replace(/\/$/, "")}/api/memories?for=${encodeURIComponent(
    day.toISOString(),
  )}`;
  const res = await fetch(url, {
    headers: { "x-api-key": apiKey, accept: "application/json" },
    next: { revalidate: 600, tags: ["immich-assets"] },
  });
  if (!res.ok) {
    throw new Error(`Immich: ${res.status} ${res.statusText}`);
  }
  const memories = (await res.json()) as MemoryResponse[];
  return memories
    .filter((m) => m.type === "on_this_day")
    .flatMap((m) => (m.assets ?? []).map(normalizeAsset));
}

export async function fetchImmichAssets(opts: {
  baseUrl: string;
  apiKey: string;
  source: ImmichSource;
  limit: number;
  orientation?: ImmichOrientation;
  withMetadata?: boolean;
}): Promise<ImmichAsset[]> {
  let items: ImmichAsset[];

  if (opts.source.kind === "onThisDay") {
    items = await fetchOnThisDay(opts.baseUrl, opts.apiKey);
  } else {
    // Immich has no orientation filter — over-fetch and filter client-side when set.
    const fetchSize = opts.orientation
      ? Math.min(opts.limit * 5, 100)
      : opts.limit;

    const body: MetadataSearchBody = {
      size: fetchSize,
      type: "IMAGE",
      order: "desc",
    };
    if (opts.source.kind === "favorites") {
      body.isFavorite = true;
    } else {
      body.albumIds = [opts.source.albumId];
    }

    const url = `${opts.baseUrl.replace(/\/$/, "")}/api/search/metadata`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "x-api-key": opts.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
      next: { revalidate: 600, tags: ["immich-assets"] },
    });
    if (!res.ok) {
      throw new Error(`Immich: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json()) as SearchResponse;
    items = (json.assets?.items ?? []).map((a) => normalizeAsset(a as RawAsset));
  }

  const final = opts.orientation
    ? items
        .filter((a) => matchesOrientation(a, opts.orientation!))
        .slice(0, opts.limit)
    : items.slice(0, opts.limit);

  // List/memory responses don't reliably include face data — enrich the few
  // assets we actually show with a per-asset fetch when the caption needs it.
  if (opts.withMetadata && final.length > 0) {
    return Promise.all(
      final.map(async (a) => {
        const detail = await fetchImmichAssetDetail(opts.baseUrl, opts.apiKey, a.id);
        return detail ?? a;
      }),
    );
  }
  return final;
}

export type ImmichStatistics = {
  photos: number;
  videos: number;
  usage: number;
};

export async function fetchImmichStatistics(opts: {
  baseUrl: string;
  apiKey: string;
}): Promise<ImmichStatistics> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/api/server/statistics`;
  const res = await fetch(url, {
    headers: {
      "x-api-key": opts.apiKey,
      accept: "application/json",
    },
    next: { revalidate: 3600, tags: ["immich-statistics"] },
  });
  if (!res.ok) {
    throw new Error(`Immich: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ImmichStatistics;
}

export async function fetchImmichThumbnail(opts: {
  baseUrl: string;
  apiKey: string;
  assetId: string;
  size?: "thumbnail" | "preview";
}): Promise<Response> {
  const size = opts.size ?? "preview";
  const url = `${opts.baseUrl.replace(/\/$/, "")}/api/assets/${opts.assetId}/thumbnail?size=${size}`;
  return fetch(url, {
    headers: { "x-api-key": opts.apiKey },
    next: { revalidate: 86_400, tags: ["immich-thumb"] },
  });
}
