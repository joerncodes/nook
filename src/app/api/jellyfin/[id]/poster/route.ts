import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { fetchJellyfinPoster } from "@/lib/jellyfin";

type Params = { params: Promise<{ id: string }> };

function findJellyfinCreds(
  cfg: Awaited<ReturnType<typeof loadConfig>>,
): { baseUrl: string; apiKey: string } | null {
  const all = [...cfg.center, ...cfg.columns.flatMap((c) => c.widgets)];
  const w = all.find((x) => x.type === "jellyfin");
  if (!w || w.type !== "jellyfin") return null;
  return { baseUrl: w.baseUrl, apiKey: w.apiKey };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!id) return new NextResponse("missing id", { status: 400 });

  const cfg = await loadConfig();
  const creds = findJellyfinCreds(cfg);
  if (!creds)
    return new NextResponse("no jellyfin widget configured", { status: 404 });

  const upstream = await fetchJellyfinPoster({
    baseUrl: creds.baseUrl,
    apiKey: creds.apiKey,
    itemId: id,
    maxHeight: 480,
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse(`upstream ${upstream.status}`, {
      status: upstream.status,
    });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
