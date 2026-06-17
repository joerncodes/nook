import { NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { fetchImmichThumbnail } from "@/lib/immich";

type Params = { params: Promise<{ id: string }> };

function findImmichCreds(
  cfg: Awaited<ReturnType<typeof loadConfig>>,
): { baseUrl: string; apiKey: string } | null {
  const all = [
    ...cfg.center,
    ...cfg.columns.flatMap((c) => c.widgets),
  ];
  const w = all.find((x) => x.type === "immich");
  if (!w || w.type !== "immich") return null;
  return { baseUrl: w.baseUrl, apiKey: w.apiKey };
}

export async function GET(_req: Request, { params }: Params) {
  const { id } = await params;
  if (!id) return new NextResponse("missing id", { status: 400 });

  const cfg = await loadConfig();
  const creds = findImmichCreds(cfg);
  if (!creds) return new NextResponse("no immich widget configured", { status: 404 });

  const upstream = await fetchImmichThumbnail({
    baseUrl: creds.baseUrl,
    apiKey: creds.apiKey,
    assetId: id,
  });

  if (!upstream.ok || !upstream.body) {
    return new NextResponse(`upstream ${upstream.status}`, { status: upstream.status });
  }

  return new NextResponse(upstream.body, {
    status: 200,
    headers: {
      "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
