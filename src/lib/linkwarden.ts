export type LinkwardenLink = {
  id: number;
  name: string;
  url: string;
  description?: string;
  createdAt?: string;
  collection?: { id?: number; name?: string; color?: string };
  tags?: { id?: number; name?: string }[];
};

export type LinkwardenScope = {
  collectionId?: number;
  tagId?: number;
};

type LinksResponse = { response?: LinkwardenLink[] };

function buildLinksUrl(
  baseUrl: string,
  params: Record<string, string | number | undefined>,
): string {
  const url = new URL("/api/v1/links", baseUrl.replace(/\/$/, "") + "/");
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export async function fetchRecentLinks(opts: {
  baseUrl: string;
  token: string;
  limit: number;
  scope?: LinkwardenScope;
}): Promise<LinkwardenLink[]> {
  const url = buildLinksUrl(opts.baseUrl, {
    sort: 0,
    limit: opts.limit,
    collectionId: opts.scope?.collectionId,
    tagId: opts.scope?.tagId,
  });
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${opts.token}`,
      accept: "application/json",
    },
    next: { revalidate: 600, tags: ["linkwarden-recent"] },
  });
  if (!res.ok) {
    throw new Error(`Linkwarden: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as LinksResponse;
  return (json.response ?? []).slice(0, opts.limit);
}

export async function searchLinks(opts: {
  baseUrl: string;
  token: string;
  query: string;
  limit?: number;
  scope?: LinkwardenScope;
}): Promise<LinkwardenLink[]> {
  const url = buildLinksUrl(opts.baseUrl, {
    searchQueryString: opts.query,
    limit: opts.limit ?? 8,
    collectionId: opts.scope?.collectionId,
    tagId: opts.scope?.tagId,
  });
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${opts.token}`,
      accept: "application/json",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Linkwarden: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as LinksResponse;
  return json.response ?? [];
}
