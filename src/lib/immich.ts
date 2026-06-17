export type ImmichAsset = {
  id: string;
  originalFileName?: string;
  fileCreatedAt?: string;
  width?: number;
  height?: number;
};

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

export type ImmichSource =
  | { kind: "favorites" }
  | { kind: "album"; albumId: string };

export async function fetchImmichAssets(opts: {
  baseUrl: string;
  apiKey: string;
  source: ImmichSource;
  limit: number;
}): Promise<ImmichAsset[]> {
  const body: MetadataSearchBody = {
    size: opts.limit,
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
  return json.assets?.items ?? [];
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
