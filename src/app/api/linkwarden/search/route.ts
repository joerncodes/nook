import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { hostOf, searchLinks } from "@/lib/linkwarden";

function findLinkwardenCreds(cfg: Awaited<ReturnType<typeof loadConfig>>) {
  const all = [...cfg.center, ...cfg.columns.flatMap((c) => c.widgets)];
  const w = all.find((x) => x.type === "linkwarden");
  if (!w || w.type !== "linkwarden") return null;
  return {
    baseUrl: w.baseUrl,
    token: w.token,
    collectionId: w.collectionId,
    tagId: w.tagId,
  };
}

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json(
      { results: [] },
      { headers: { "cache-control": "no-store" } },
    );
  }

  const cfg = await loadConfig();
  const creds = findLinkwardenCreds(cfg);
  if (!creds) {
    return new NextResponse("no linkwarden widget configured", { status: 404 });
  }

  try {
    const links = await searchLinks({
      baseUrl: creds.baseUrl,
      token: creds.token,
      query: q,
      limit: 8,
      scope: { collectionId: creds.collectionId, tagId: creds.tagId },
    });
    const results = links.map((l) => ({
      id: l.id,
      name: l.name || l.url,
      url: l.url,
      host: hostOf(l.url),
      collectionColor: l.collection?.color,
      collectionName: l.collection?.name,
    }));
    return NextResponse.json(
      { results },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "search failed";
    return NextResponse.json(
      { error: msg, results: [] },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}
