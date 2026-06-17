export type EdgewiseImage = {
  filename: string;
  caption?: string;
};

export type EdgewiseKnife = {
  id: string;
  name: string;
  ownerId: string;
  manufacturer?: string;
  steel?: string;
  handle?: string;
  type?: string;
  subtype?: string;
  backlog?: boolean;
  backlogPosition?: number | null;
  onLoan?: boolean;
  images?: EdgewiseImage[];
};

export type EdgewiseOwner = {
  id: string;
  name: string;
  contact?: string;
};

export type EdgewiseSummary = {
  total: number;
  backlog: number;
  onLoan: number;
  backlogQueue: EdgewiseKnife[];
};

type KnivesResponse = { knives: EdgewiseKnife[] };
type OwnersResponse = { owners: EdgewiseOwner[] };

async function fetchJson<T>(
  baseUrl: string,
  path: string,
  token: string,
  tag: string,
): Promise<T> {
  const url = `${baseUrl.replace(/\/$/, "")}${path}`;
  const res = await fetch(url, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
    },
    next: { revalidate: 300, tags: [tag] },
  });
  if (!res.ok) {
    throw new Error(`Edgewise: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function fetchEdgewiseKnives(opts: {
  baseUrl: string;
  token: string;
}): Promise<EdgewiseKnife[]> {
  const json = await fetchJson<KnivesResponse>(
    opts.baseUrl,
    "/api/knives",
    opts.token,
    "edgewise-knives",
  );
  return json.knives ?? [];
}

export async function fetchEdgewiseOwners(opts: {
  baseUrl: string;
  token: string;
}): Promise<EdgewiseOwner[]> {
  const json = await fetchJson<OwnersResponse>(
    opts.baseUrl,
    "/api/owners",
    opts.token,
    "edgewise-owners",
  );
  return json.owners ?? [];
}

export function summarize(knives: EdgewiseKnife[]): EdgewiseSummary {
  const backlogQueue = knives
    .filter((k) => k.backlog)
    .sort((a, b) => {
      const ap = a.backlogPosition ?? Number.POSITIVE_INFINITY;
      const bp = b.backlogPosition ?? Number.POSITIVE_INFINITY;
      if (ap !== bp) return ap - bp;
      return a.name.localeCompare(b.name);
    });
  return {
    total: knives.length,
    backlog: backlogQueue.length,
    onLoan: knives.filter((k) => k.onLoan).length,
    backlogQueue,
  };
}

export async function fetchEdgewiseImage(opts: {
  baseUrl: string;
  token: string;
  knifeId: string;
  filename: string;
}): Promise<Response> {
  const url = `${opts.baseUrl.replace(/\/$/, "")}/api/knives/${encodeURIComponent(
    opts.knifeId,
  )}/images/${encodeURIComponent(opts.filename)}`;
  return fetch(url, {
    headers: { authorization: `Bearer ${opts.token}` },
    next: { revalidate: 86_400, tags: ["edgewise-image"] },
  });
}
