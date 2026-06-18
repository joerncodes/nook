export type JellyfinLatestMovie = {
  id: string;
  name: string;
  productionYear?: number;
  directors: string[];
  cast: string[];
};

export type JellyfinSummary = {
  movieCount: number;
  episodeCount: number;
  latest: JellyfinLatestMovie[];
};

type CountResponse = { TotalRecordCount?: number };

type JellyfinPerson = {
  Name?: string;
  Type?: string;
  Role?: string;
};

type LatestItem = {
  Id: string;
  Name: string;
  ProductionYear?: number;
  Type?: string;
  People?: JellyfinPerson[];
};

function authHeaders(apiKey: string): HeadersInit {
  return {
    "X-Emby-Token": apiKey,
    accept: "application/json",
  };
}

function trimBase(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

async function fetchCount(opts: {
  baseUrl: string;
  apiKey: string;
  userId: string;
  itemType: "Movie" | "Episode";
}): Promise<number> {
  const url = new URL(`${trimBase(opts.baseUrl)}/Items`);
  url.searchParams.set("userId", opts.userId);
  url.searchParams.set("IncludeItemTypes", opts.itemType);
  url.searchParams.set("Recursive", "true");
  url.searchParams.set("Limit", "0");

  const res = await fetch(url.toString(), {
    headers: authHeaders(opts.apiKey),
    next: { revalidate: 3600, tags: ["jellyfin-counts"] },
  });
  if (!res.ok) {
    throw new Error(`Jellyfin: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as CountResponse;
  return json.TotalRecordCount ?? 0;
}

async function fetchLatestMovies(opts: {
  baseUrl: string;
  apiKey: string;
  userId: string;
  limit: number;
}): Promise<JellyfinLatestMovie[]> {
  const url = new URL(`${trimBase(opts.baseUrl)}/Items`);
  url.searchParams.set("userId", opts.userId);
  url.searchParams.set("IncludeItemTypes", "Movie");
  url.searchParams.set("Recursive", "true");
  url.searchParams.set("SortBy", "DateCreated");
  url.searchParams.set("SortOrder", "Descending");
  url.searchParams.set("Limit", String(opts.limit));
  url.searchParams.set("Fields", "ProductionYear,People");

  const res = await fetch(url.toString(), {
    headers: authHeaders(opts.apiKey),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Jellyfin: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { Items?: LatestItem[] };
  const items = json.Items ?? [];
  return items.map((m) => {
    const people = m.People ?? [];
    const directors = people
      .filter((p) => p.Type === "Director")
      .map((p) => p.Name?.trim())
      .filter((n): n is string => Boolean(n));
    const cast = people
      .filter((p) => p.Type === "Actor")
      .map((p) => p.Name?.trim())
      .filter((n): n is string => Boolean(n))
      .slice(0, 3);
    return {
      id: m.Id,
      name: m.Name,
      productionYear: m.ProductionYear,
      directors,
      cast,
    };
  });
}

export async function fetchJellyfinSummary(opts: {
  baseUrl: string;
  apiKey: string;
  userId: string;
}): Promise<JellyfinSummary> {
  const [movieCount, episodeCount, latest] = await Promise.all([
    fetchCount({ ...opts, itemType: "Movie" }),
    fetchCount({ ...opts, itemType: "Episode" }),
    fetchLatestMovies({ ...opts, limit: 10 }),
  ]);
  return { movieCount, episodeCount, latest };
}

export async function fetchJellyfinPoster(opts: {
  baseUrl: string;
  apiKey: string;
  itemId: string;
  maxHeight?: number;
}): Promise<Response> {
  const url = new URL(
    `${trimBase(opts.baseUrl)}/Items/${opts.itemId}/Images/Primary`,
  );
  if (opts.maxHeight) {
    url.searchParams.set("maxHeight", String(opts.maxHeight));
  }
  return fetch(url.toString(), {
    headers: { "X-Emby-Token": opts.apiKey },
    next: { revalidate: 86_400, tags: ["jellyfin-poster"] },
  });
}
