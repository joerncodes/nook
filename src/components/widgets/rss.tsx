import { XMLParser } from "fast-xml-parser";

type Props = {
  url: string;
  limit?: number;
};

type Item = { title: string; link: string; pubDate?: string };

type RssShape = {
  rss?: { channel?: { item?: RawItem | RawItem[] } };
  feed?: { entry?: RawEntry | RawEntry[] };
};

type RawItem = {
  title?: string | { "#text"?: string };
  link?: string;
  pubDate?: string;
};

type RawEntry = {
  title?: string | { "#text"?: string };
  link?: string | { "@_href"?: string } | Array<{ "@_href"?: string }>;
  updated?: string;
  published?: string;
};

function textOf(v: string | { "#text"?: string } | undefined): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v["#text"] ?? "";
}

function linkOfAtom(l: RawEntry["link"]): string {
  if (!l) return "";
  if (typeof l === "string") return l;
  if (Array.isArray(l)) return l[0]?.["@_href"] ?? "";
  return l["@_href"] ?? "";
}

async function fetchFeed(url: string, limit: number): Promise<Item[]> {
  const res = await fetch(url, {
    next: { revalidate: 600 },
    headers: { "User-Agent": "nook-dashboard/1.0" },
  });
  if (!res.ok) throw new Error(`feed ${url}: ${res.status}`);
  const xml = await res.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });
  const data = parser.parse(xml) as RssShape;

  if (data.rss?.channel?.item) {
    const raw = data.rss.channel.item;
    const items = Array.isArray(raw) ? raw : [raw];
    return items.slice(0, limit).map((it) => ({
      title: textOf(it.title),
      link: it.link ?? "",
      pubDate: it.pubDate,
    }));
  }

  if (data.feed?.entry) {
    const raw = data.feed.entry;
    const entries = Array.isArray(raw) ? raw : [raw];
    return entries.slice(0, limit).map((e) => ({
      title: textOf(e.title),
      link: linkOfAtom(e.link),
      pubDate: e.updated ?? e.published,
    }));
  }

  return [];
}

export async function RssWidget({ url, limit = 10 }: Props) {
  let items: Item[] = [];
  let error: string | null = null;
  try {
    items = await fetchFeed(url, limit);
  } catch (e) {
    error = e instanceof Error ? e.message : "failed to fetch";
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">Failed to load feed: {error}</div>
    );
  }

  if (items.length === 0) {
    return <div className="text-sm text-muted-foreground">No items.</div>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={`${it.link}-${i}`}>
          <a
            href={it.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm leading-snug text-foreground/90 transition-colors hover:text-foreground"
          >
            {it.title}
          </a>
        </li>
      ))}
    </ul>
  );
}
